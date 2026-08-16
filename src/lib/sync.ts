import { get, set, keys } from "idb-keyval";
import type { Course } from "@/types/course";

// Armazena metadata local para sync: { [courseId]: { pendingStructure: boolean, pendingProgress: boolean, localTimestamp: number } }
const SYNC_METADATA_KEY = "aivur_sync_meta";

let debounceTimers: Record<string, NodeJS.Timeout> = {};

export async function markPendingSync(courseId: string, dataType: "course_structure" | "course_progress") {
  // Atualiza metadata local
  const meta = await get(SYNC_METADATA_KEY) || {};
  if (!meta[courseId]) {
    meta[courseId] = { pendingStructure: false, pendingProgress: false, localTimestamp: Date.now() };
  }
  
  meta[courseId].localTimestamp = Date.now();
  if (dataType === "course_structure") meta[courseId].pendingStructure = true;
  if (dataType === "course_progress") meta[courseId].pendingProgress = true;
  
  await set(SYNC_METADATA_KEY, meta);

  // Aciona debounce de 5 segundos
  const timerKey = `${courseId}_${dataType}`;
  if (debounceTimers[timerKey]) {
    clearTimeout(debounceTimers[timerKey]);
  }
  
  debounceTimers[timerKey] = setTimeout(() => {
    pushSync(courseId, dataType);
  }, 5000);
}

export async function pushSync(courseId: string, dataType: "course_structure" | "course_progress") {
  try {
    let snapshot;
    if (dataType === "course_structure") {
      const courses = await get<Course[]>("aivur_local_courses") || [];
      snapshot = courses.find(c => c.id === courseId);
      if (!snapshot) return; // Curso já não existe mais
    } else {
      snapshot = await get(`aivur_progress_${courseId}`);
      if (!snapshot) return; // Sem progresso
    }

    const meta = await get(SYNC_METADATA_KEY) || {};
    const updatedAt = meta[courseId]?.localTimestamp || Date.now();

    const res = await fetch("/api/sync/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        dataType,
        updatedAt,
        snapshot
      })
    });

    if (res.status === 401) {
      console.log("Sync push ignorado (usuário offline ou não autenticado).");
      return;
    }

    if (res.status === 409) {
      console.warn("Conflito de Timestamp no Push LWW. Push abortado.");
      return;
    }

    if (!res.ok) throw new Error("Erro no servidor");

    // Limpa a flag pending
    if (dataType === "course_structure") meta[courseId].pendingStructure = false;
    if (dataType === "course_progress") meta[courseId].pendingProgress = false;
    await set(SYNC_METADATA_KEY, meta);
    console.log(`✅ [Sync] ${dataType} do curso ${courseId} salvo na nuvem.`);

  } catch (err) {
    console.error(`❌ [Sync] Falha no push de ${dataType} para ${courseId}`, err);
  }
}

export async function pullSync() {
  try {
    // PULL - Download inicial na abertura (Risco 2 Salvaguarda)
    // 1. Verifica se há algo pending localmente
    const meta = await get(SYNC_METADATA_KEY) || {};
    const localCourses = Object.keys(meta).map(courseId => ({
      courseId,
      localTimestamp: meta[courseId].localTimestamp,
      pendingStructure: meta[courseId].pendingStructure,
      pendingProgress: meta[courseId].pendingProgress
    }));

    // Compulsory PUSH de pendentes ANTES de puxar
    for (const c of localCourses) {
      if (c.pendingStructure) await pushSync(c.courseId, "course_structure");
      if (c.pendingProgress) await pushSync(c.courseId, "course_progress");
    }

    // 2. Faz o Pull
    const res = await fetch("/api/sync/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courses: localCourses })
    });

    if (res.status === 401) return false; // Not logged in
    const data = await res.json();
    if (!data.success) return false;

    if (data.updates && data.updates.length > 0) {
      // 3. BACKUP PREVENTIVO antes de sobrescrever
      const currentCourses = await get("aivur_local_courses");
      await set("backup_pre_sync_courses", { timestamp: Date.now(), data: currentCourses });

      let coursesArray = (await get<Course[]>("aivur_local_courses")) || [];

      for (const update of data.updates) {
        if (update.dataType === "course_structure") {
          coursesArray = coursesArray.filter(c => c.id !== update.courseId);
          coursesArray.push(update.snapshot);
          meta[update.courseId] = { ...meta[update.courseId], localTimestamp: update.timestamp, pendingStructure: false };
        } else {
          // Backup progress
          const currProg = await get(`aivur_progress_${update.courseId}`);
          await set(`backup_pre_sync_prog_${update.courseId}`, { timestamp: Date.now(), data: currProg });
          
          await set(`aivur_progress_${update.courseId}`, update.snapshot);
          meta[update.courseId] = { ...meta[update.courseId], localTimestamp: update.timestamp, pendingProgress: false };
        }
      }

      await set("aivur_local_courses", coursesArray);
      await set(SYNC_METADATA_KEY, meta);
      console.log(`✅ [Sync] ${data.updates.length} atualizações recebidas da nuvem e aplicadas!`);
      return true; // Indicador de que dados mudaram e a UI deve recarregar
    }
    
    return false;
  } catch (err) {
    console.error("❌ [Sync] Falha no pull", err);
    return false;
  }
}

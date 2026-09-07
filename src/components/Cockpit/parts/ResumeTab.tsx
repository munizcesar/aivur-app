import { BookOpen, CheckCircle2 } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

export default function ResumeTab() {
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const completedTopicIds = useStudyStore((state) => state.completedTopicIds);
  const toggleTopicCompletion = useStudyStore((state) => state.toggleTopicCompletion);

  const isCompleted = currentTopicId ? completedTopicIds.includes(currentTopicId) : false;

  const Highlight = ({ children }: { children: React.ReactNode }) => (
    <span className="bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
      {children}
    </span>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 my-4 p-8 md:p-12">
      {/* Título do Tópico */}
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
        Princípios da Administração Pública
      </h2>

      {/* Corpo do Texto */}
      <div className="text-lg text-slate-700 leading-relaxed space-y-6">
        <p>
          O artigo 37 da Constituição Federal de 1988 consagra os princípios basilares que regem a Administração Pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios. Estes princípios formam o mnemônico <Highlight>LIMPE</Highlight>.
        </p>

        <p>
          São eles:
        </p>

        {/* Listas (Bullet Points) */}
        <ul className="list-disc list-inside space-y-3 ml-4">
          <li>
            <Highlight>L</Highlight>egalidade: O administrador público só pode fazer o que a lei autoriza ou determina.
          </li>
          <li>
            <Highlight>I</Highlight>mpessoalidade: A atuação administrativa deve ser genérica e voltada ao interesse público, vedada a promoção pessoal.
          </li>
          <li>
            <Highlight>M</Highlight>oralidade: Exige conduta ética, honesta, com boa-fé e probidade por parte do agente público.
          </li>
          <li>
            <Highlight>P</Highlight>ublicidade: Dever de transparência dos atos administrativos, salvo exceções de segurança e intimidade.
          </li>
          <li>
            <Highlight>E</Highlight>ficiência: Inserido pela Emenda Constitucional 19/98, exige prestação de serviços com presteza, perfeição e rendimento funcional.
          </li>
        </ul>

        <p>
          Lembre-se que, no direito administrativo, a <Highlight>legalidade estrita</Highlight> difere da legalidade no direito privado (onde é permitido fazer tudo o que a lei não proíbe).
        </p>
      </div>

      {/* Rodapé e Call to Action (Zustand Integration) */}
      <hr className="my-8 border-slate-100" />
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <BookOpen size={20} className="shrink-0 flex-none" />
          <span>Leitura estimada: 3 min</span>
        </div>
        
        {currentTopicId && (
          <button
            type="button"
            onClick={() => toggleTopicCompletion(currentTopicId)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] cursor-pointer relative z-10 ${
              isCompleted
                ? "bg-emerald-50 text-emerald-700 border border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 size={20} className="shrink-0 flex-none" />
                Resumo Concluído
              </>
            ) : (
              <>
                Marcar como Lido
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

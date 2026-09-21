const fs = require('fs');
let c = fs.readFileSync('src/components/Trilhas/CriarTrilhaView.tsx', 'utf8');

c = c.replace(/bg-\[#C9A84C\]\/15 text-\[#C9A84C\]/g, 'bg-[var(--color-navy)] text-[var(--color-cream)]');
c = c.replace(/<FolderCheck className="w-4 h-4" \/>/g, '<FolderCheck size={16} className="shrink-0" />');
c = c.replace(/<AlertCircle className="w-5 h-5 text-\[var\(--color-red\)\] flex-shrink-0 mt-0.5" \/>/g, '<AlertCircle size={20} className="text-[var(--color-red)] shrink-0 mt-0.5" />');
c = c.replace(/w-6 h-6 rounded-full bg-\[#C9A84C\] text-white/g, 'shrink-0 w-6 h-6 rounded-full bg-[var(--color-navy)] text-[var(--color-cream)]');
c = c.replace(/<FileText className="w-4 h-4" \/>/g, '<FileText size={16} className="shrink-0" />');
c = c.replace(/<UploadCloud className="w-4 h-4" \/>/g, '<UploadCloud size={16} className="shrink-0" />');
c = c.replace(/<UploadCloud className="w-10 h-10 text-\[var\(--color-slate-blue\)\]" \/>/g, '<UploadCloud size={40} className="text-[var(--color-slate-blue)] shrink-0" />');
c = c.replace(/<ArrowRight className="w-4 h-4 ml-1" \/>/g, '<ArrowRight size={16} className="ml-1 shrink-0" />');
c = c.replace(/<Edit2 className="w-4 h-4 text-\[var\(--color-slate-blue\)\] opacity-0 group-hover:opacity-100 transition-opacity" \/>/g, '<Edit2 size={16} className="text-[var(--color-slate-blue)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />');
c = c.replace(/<CheckCircle2 className="w-4 h-4" \/>/g, '<CheckCircle2 size={16} className="shrink-0" />');
c = c.replace(/<Sparkles className="w-3\.5 h-3\.5" \/>/g, '<Sparkles size={14} className="shrink-0" />');

fs.writeFileSync('src/components/Trilhas/CriarTrilhaView.tsx', c);

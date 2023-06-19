export function getRarityClassNames(rating) {
    if (rating >= 85) return 'bg-[#ca1afc] text-white';
    if (rating >= 75) return 'bg-[#016bd5] text-white';
    if (rating >= 65) return 'bg-[#35ae25] text-white';
    return 'bg-slate-200 text-slate-900';
}
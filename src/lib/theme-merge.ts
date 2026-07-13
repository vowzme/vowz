// Pure helpers for the Themes.tsx "Apply on top of existing" flow.
// Extracted so the merge behavior can be unit-tested in isolation.

export const mergeSectionData = (userData: any, tplData: any) => {
  if (!userData || typeof userData !== "object") {
    return tplData && typeof tplData === "object" ? { ...tplData } : (tplData ?? {});
  }
  const out: any = { ...userData };
  if (tplData && typeof tplData === "object") {
    for (const k of Object.keys(tplData)) {
      if (!(k in userData)) out[k] = (tplData as any)[k];
    }
  }
  return out;
};

export const mergeSections = (userSections: any[], tplSections: any[]) => {
  const tplById = new Map<string, any>((tplSections || []).map((s) => [s.id, s]));
  const userIds = new Set((userSections || []).map((s) => s.id));
  const merged = (userSections || []).map((u) => {
    const tpl = tplById.get(u.id);
    if (!tpl) return u;
    return {
      ...tpl,
      ...u,
      title: u.title || tpl.title,
      visible: typeof u.visible === "boolean" ? u.visible : tpl.visible,
      data: mergeSectionData(u.data, tpl.data),
    };
  });
  const missing = (tplSections || []).filter((s) => !userIds.has(s.id));
  return [...merged, ...missing];
};
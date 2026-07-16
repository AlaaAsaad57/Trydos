// Single source of truth for product comment / review / FAQ data.
//
// Every widget that shows the same comment (product-page list, buyers modal,
// FAQ list, FAQ modal, extended comments area) renders from these shared
// entities instead of its own private copy, so an edit / delete / like / new
// question performed in one widget reflects instantly in all the others without
// a reload. Widgets still own their pagination (which ids they show and in what
// order); only the per-comment DATA lives here.
export const useCommentsStore = (set, get) => ({
  // id -> latest comment object. Server fetches upsert here; edits/reactions
  // patch here.
  commentEntities: {} as Record<string, any>,
  // id -> true once soft-deleted, so every widget hides it at once.
  deletedCommentIds: {} as Record<string, boolean>,
  // productId -> ids of FAQ questions created this session, newest first, so a
  // new question fans out to every mounted FAQ widget (reviews can't be added).
  appendedFaqIds: {} as Record<string, string[]>,

  // Merge a fetched page into the entity map (server data wins for the fields it
  // carries). Refreshes like counts / text across all widgets on any refetch.
  upsertComments: (list: any[]) =>
    set((s: any) => {
      if (!list?.length) return {} as any;
      const next = { ...s.commentEntities };
      for (const c of list) {
        if (c?.id == null) continue;
        next[c.id] = { ...next[c.id], ...c };
      }
      return { commentEntities: next };
    }),

  // Patch one comment (edit text/rating, react like counts, seller reply, ...).
  patchCommentEntity: (id: string, fields: any) =>
    set((s: any) => ({
      commentEntities: {
        ...s.commentEntities,
        [id]: { ...s.commentEntities[id], ...fields },
      },
    })),

  // Soft-delete: item components render null for this id everywhere.
  removeCommentEntity: (id: string) =>
    set((s: any) => ({
      deletedCommentIds: { ...s.deletedCommentIds, [id]: true },
    })),

  // Register a newly-created FAQ question so every mounted FAQ widget shows it.
  appendFaqComment: (productId: string, comment: any) =>
    set((s: any) => ({
      commentEntities: { ...s.commentEntities, [comment.id]: comment },
      appendedFaqIds: {
        ...s.appendedFaqIds,
        [String(productId)]: [
          comment.id,
          ...(s.appendedFaqIds[String(productId)] || []).filter(
            (x: string) => x !== comment.id,
          ),
        ],
      },
    })),
});

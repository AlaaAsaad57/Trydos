import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn: (data) => createStory(data),
    onMutate: () => {},

    onError: () => {},

    onSuccess: () => {},

    onSettled: async (_, error) => {
      if (error) {
      } else {
        await queryClient.invalidateQueries({ queryKey: ["story"] });
      }
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn: (data) => updateStory(data),

    onSettled: async (_, error, variables) => {
      if (error) {
      } else {
        await queryClient.invalidateQueries({ queryKey: ["story"] });
        await queryClient.invalidateQueries({
          queryKey: ["story"],
        });
      }
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn: (id: number) => deleteStory(id),

    onSuccess: () => {},

    onSettled: async (_, error) => {
      if (error) {
      } else {
        await queryClient.invalidateQueries({ queryKey: ["story"] });
      }
    },
  });
}

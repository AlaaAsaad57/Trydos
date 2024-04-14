import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addUser, fetchUsers } from "services/users";

export default function Demo() {
  const queryClient = useQueryClient();

  const { data: Users, isLoading } = useQuery({
    queryKey: ["Users"],
    queryFn: () => fetchUsers(),
    staleTime: Infinity,
    cacheTime: 0,
  });

  const { mutateAsync: addUserMutation } = useMutation({
    mutationFn: addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Users"] });
    },
  });
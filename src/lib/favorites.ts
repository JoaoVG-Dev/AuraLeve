import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addFavoriteProductFn,
  getFavoriteProductIdsFn,
  getFavoriteProductsFn,
  removeFavoriteProductFn,
} from "@/lib/favorites.functions";
import type { Product } from "@/lib/types";

const favoriteKeys = {
  ids: (userId?: string) => ["favorites", "ids", userId ?? "guest"] as const,
  products: (userId?: string) => ["favorites", "products", userId ?? "guest"] as const,
};

export function useFavoriteProductIds(userId?: string) {
  const getFavoriteProductIds = useServerFn(getFavoriteProductIdsFn);

  return useQuery({
    enabled: !!userId,
    queryKey: favoriteKeys.ids(userId),
    queryFn: () => getFavoriteProductIds(),
  });
}

export function useFavoriteProducts(userId?: string) {
  const getFavoriteProducts = useServerFn(getFavoriteProductsFn);

  return useQuery({
    enabled: !!userId,
    queryKey: favoriteKeys.products(userId),
    queryFn: () => getFavoriteProducts(),
  });
}

export function useToggleFavorite(userId?: string) {
  const queryClient = useQueryClient();
  const addFavorite = useServerFn(addFavoriteProductFn);
  const removeFavorite = useServerFn(removeFavoriteProductFn);

  return useMutation({
    mutationFn: async ({ productId, favorite }: { productId: string; favorite: boolean }) => {
      if (!userId) throw new Error("Entre para salvar seus favoritos.");
      if (favorite) return addFavorite({ data: { productId } });
      return removeFavorite({ data: { productId } });
    },
    onMutate: async ({ productId, favorite }) => {
      if (!userId) return {};

      await Promise.all([
        queryClient.cancelQueries({ queryKey: favoriteKeys.ids(userId) }),
        queryClient.cancelQueries({ queryKey: favoriteKeys.products(userId) }),
      ]);

      const previousIds = queryClient.getQueryData<string[]>(favoriteKeys.ids(userId)) ?? [];
      const previousProducts = queryClient.getQueryData<Product[]>(favoriteKeys.products(userId));

      queryClient.setQueryData<string[]>(
        favoriteKeys.ids(userId),
        favorite
          ? Array.from(new Set([...previousIds, productId]))
          : previousIds.filter((id) => id !== productId),
      );

      if (!favorite && previousProducts) {
        queryClient.setQueryData<Product[]>(
          favoriteKeys.products(userId),
          previousProducts.filter((product) => product.id !== productId),
        );
      }

      return { previousIds, previousProducts };
    },
    onError: (_error, _variables, context) => {
      if (!userId || !context) return;
      if ("previousIds" in context) {
        queryClient.setQueryData(favoriteKeys.ids(userId), context.previousIds);
      }
      if ("previousProducts" in context && context.previousProducts) {
        queryClient.setQueryData(favoriteKeys.products(userId), context.previousProducts);
      }
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: favoriteKeys.ids(userId) });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.products(userId) });
    },
  });
}

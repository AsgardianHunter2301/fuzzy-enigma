/*
 * radix_sort.c - see radix_sort.h. The body is the bridge text, unchanged.
 */
#include "radix_sort.h"

#include <stdlib.h>

struct bucket {
    Key *item;
    int size;
    int capacity;
};

static void bucketAppend(struct bucket *b, Key key) {
    if (b->size == b->capacity) {
        int newCapacity = b->capacity == 0 ? 4 : 2 * b->capacity;
        Key *newItems = realloc(b->item, newCapacity * sizeof(*newItems));
        if (newItems == NULL) exit(EXIT_FAILURE);
        b->item = newItems;
        b->capacity = newCapacity;
    }
    b->item[b->size++] = key;
}

void radixSort(Key A[], int n, int m, int R, SymbolIndex symbolIndex) {
    struct bucket *bucket = calloc(R, sizeof(*bucket));
    if (bucket == NULL) exit(EXIT_FAILURE);

    for (int i = m - 1; i >= 0; i--) {
        for (int r = 0; r < R; r++) bucket[r].size = 0;

        for (int j = 0; j < n; j++) {
            int r = symbolIndex(A[j], i);
            bucketAppend(&bucket[r], A[j]);
        }

        int k = 0;
        for (int r = 0; r < R; r++) {
            for (int j = 0; j < bucket[r].size; j++) {
                A[k++] = bucket[r].item[j];
            }
        }
    }

    for (int r = 0; r < R; r++) free(bucket[r].item);
    free(bucket);
}

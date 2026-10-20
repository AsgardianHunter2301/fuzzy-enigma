/*
 * avl.h - the AVL bridges (insertion/rebalancing, search, deletion) together
 * with the deleteRoot helper that finding BRG-05 showed was assumed by the
 * deletion bridge but defined nowhere in the repository.
 *
 * SOURCE LABEL: SUPPLEMENTAL C. The matching pseudocode is in the 26T2 manual;
 * this C conversion is not. Learn it separately.
 *
 * Declared contract:
 *   - struct node stores its own height. An empty tree has height -1 and a
 *     leaf has height 0.
 *   - The ordering rule is the BST rule and duplicates are ignored: inserting a
 *     value already present returns the tree unchanged.
 *   - Every function that can restructure the tree returns the new subtree
 *     root, which the caller must store back: t = avlInsert(t, v).
 *   - Ownership: nodes are malloc'ed by avlInsert and freed by avlDelete (one
 *     node) or avlFree (the whole tree). The caller owns the root pointer.
 */
#ifndef BRIDGES_C_AVL_H
#define BRIDGES_C_AVL_H

#include <stdbool.h>

struct node {
    int item;
    struct node *left;
    struct node *right;
    int height;
};

struct node *avlInsert(struct node *t, int v);
bool avlSearch(struct node *t, int v);
struct node *avlDelete(struct node *t, int v);

/* The helper the deletion bridge assumed. Removes the root of t, frees exactly
 * that node, and returns the replacement subtree root with every stored height
 * on the internal removal path updated and every node on it rebalanced. */
struct node *deleteRoot(struct node *t);

/* Test and driver support (not part of the displayed bridge). */
void avlFree(struct node *t);
int avlNodeHeight(struct node *t);
int avlSize(struct node *t);
bool avlCheck(struct node *t);           /* full AVL + BST + height invariant */
int avlInorder(struct node *t, int out[], int capacity);

#endif /* BRIDGES_C_AVL_H */

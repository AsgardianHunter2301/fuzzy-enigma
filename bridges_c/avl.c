/*
 * avl.c - see avl.h.
 *
 * SOURCE LABEL: SUPPLEMENTAL C conversion of 26T2 manual pseudocode, plus the
 * previously missing deleteRoot helper. The original bridge bodies are
 * preserved unmodified in original/ so the correction stays identifiable.
 */
#include "avl.h"

#include <stdlib.h>

/* ---- avl-insert-rebalance bridge: unchanged ---------------------------- */

static int height(struct node *t) {
    return t == NULL ? -1 : t->height;
}

static void updateHeight(struct node *t) {
    int leftHeight = height(t->left);
    int rightHeight = height(t->right);
    t->height = 1 + (leftHeight > rightHeight ? leftHeight : rightHeight);
}

static int balance(struct node *t) {
    return t == NULL ? 0 : height(t->left) - height(t->right);
}

static struct node *rotateLeft(struct node *t) {
    struct node *newRoot = t->right;
    t->right = newRoot->left;
    newRoot->left = t;
    updateHeight(t);
    updateHeight(newRoot);
    return newRoot;
}

static struct node *rotateRight(struct node *t) {
    struct node *newRoot = t->left;
    t->left = newRoot->right;
    newRoot->right = t;
    updateHeight(t);
    updateHeight(newRoot);
    return newRoot;
}

static struct node *avlRebalance(struct node *t) {
    updateHeight(t);
    int bal = balance(t);

    if (bal > 1) {
        if (balance(t->left) < 0) t->left = rotateLeft(t->left);
        t = rotateRight(t);
    } else if (bal < -1) {
        if (balance(t->right) > 0) t->right = rotateRight(t->right);
        t = rotateLeft(t);
    }
    return t;
}

struct node *avlInsert(struct node *t, int v) {
    if (t == NULL) {
        struct node *new = malloc(sizeof(*new));
        if (new == NULL) exit(EXIT_FAILURE);
        new->item = v;
        new->left = NULL;
        new->right = NULL;
        new->height = 0;
        return new;
    }

    if (v < t->item) {
        t->left = avlInsert(t->left, v);
    } else if (v > t->item) {
        t->right = avlInsert(t->right, v);
    } else {
        return t;
    }
    return avlRebalance(t);
}

/* ---- avl-search bridge: unchanged -------------------------------------- */

bool avlSearch(struct node *t, int v) {
    if (t == NULL) return false;
    if (v < t->item) return avlSearch(t->left, v);
    if (v > t->item) return avlSearch(t->right, v);
    return true;
}

/* ---- BRG-05: the missing deleteRoot helper ----------------------------- */

/* CORRECTION NOTE (BRG-05): the deletion bridge's conversion note says
 * "deleteRoot removes a BST root and returns the replacement subtree root", but
 * no deleteRoot was defined anywhere in the repository, so the deletion bridge
 * could not be compiled or trusted. An ordinary unbalanced BST deleteRoot is
 * not enough here: lifting the in-order successor out of the right subtree
 * shortens an internal path, and every node on that path can lose its stored
 * height and its balance. The helper below therefore rebalances on the way back
 * out of the successor hunt (removeMin) and rebalances the replacement root
 * itself, so the AVL invariant and the stored heights hold again when it
 * returns. avlDelete then rebalances each ancestor as it unwinds, which is what
 * makes a deletion cascade work. */

/* Remove the minimum node of a non-empty subtree, hand it back through
 * *minNode without freeing it, and rebalance the path it was removed from. */
static struct node *removeMin(struct node *t, struct node **minNode) {
    if (t->left == NULL) {
        *minNode = t;
        return t->right;
    }
    t->left = removeMin(t->left, minNode);
    return avlRebalance(t);
}

struct node *deleteRoot(struct node *t) {
    if (t == NULL) return NULL;

    if (t->left == NULL) {
        struct node *replacement = t->right;
        free(t);
        return replacement;           /* 0 or 1 child: nothing left to balance */
    }
    if (t->right == NULL) {
        struct node *replacement = t->left;
        free(t);
        return replacement;
    }

    /* Two children: the in-order successor takes the root's place. */
    struct node *successor = NULL;
    struct node *newRight = removeMin(t->right, &successor);
    successor->left = t->left;
    successor->right = newRight;
    free(t);
    return avlRebalance(successor);
}

/* ---- avl-delete bridge: unchanged body, now with a real deleteRoot ----- */

struct node *avlDelete(struct node *t, int v) {
    if (t == NULL) return NULL;

    if (v < t->item) {
        t->left = avlDelete(t->left, v);
    } else if (v > t->item) {
        t->right = avlDelete(t->right, v);
    } else {
        t = deleteRoot(t);
        if (t == NULL) return NULL;
    }

    return avlRebalance(t);
}

/* ---- test and driver support ------------------------------------------- */

void avlFree(struct node *t) {
    if (t == NULL) return;
    avlFree(t->left);
    avlFree(t->right);
    free(t);
}

int avlNodeHeight(struct node *t) {
    return height(t);
}

int avlSize(struct node *t) {
    return t == NULL ? 0 : 1 + avlSize(t->left) + avlSize(t->right);
}

static int checkRec(struct node *t, bool *ok, int lower, int upper,
                    bool haveLower, bool haveUpper) {
    if (t == NULL) return -1;

    if ((haveLower && t->item <= lower) || (haveUpper && t->item >= upper)) {
        *ok = false;
    }

    int lh = checkRec(t->left, ok, lower, t->item, haveLower, true);
    int rh = checkRec(t->right, ok, t->item, upper, true, haveUpper);
    int computed = 1 + (lh > rh ? lh : rh);

    if (t->height != computed) *ok = false;       /* stored height is wrong */
    if (lh - rh > 1 || rh - lh > 1) *ok = false;  /* AVL balance is broken */

    return computed;
}

bool avlCheck(struct node *t) {
    bool ok = true;
    checkRec(t, &ok, 0, 0, false, false);
    return ok;
}

static void inorderRec(struct node *t, int out[], int capacity, int *n) {
    if (t == NULL) return;
    inorderRec(t->left, out, capacity, n);
    if (*n < capacity) out[*n] = t->item;
    (*n)++;
    inorderRec(t->right, out, capacity, n);
}

int avlInorder(struct node *t, int out[], int capacity) {
    int n = 0;
    inorderRec(t, out, capacity, &n);
    return n;
}

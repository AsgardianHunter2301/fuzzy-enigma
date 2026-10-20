/*
 * test_avl.c - BRG-05 (the missing AVL deleteRoot helper). Driver for the AVL
 * insertion, search and deletion bridges plus the supplied deleteRoot.
 *
 * Under test: deleteRoot exists and links; it keeps the stored heights correct
 * and rebalances the internal removal path, so the AVL invariant survives a
 * deletion cascade; deletion of a leaf, a one-child node, a two-child node and
 * the root all work; the tree contents stay exactly the inserted set minus the
 * deleted values.
 *
 * The section "a plain BST helper would fail this test" demonstrates that these
 * checks actually discriminate: the same tree is deleted from with a
 * deliberately non-rebalancing helper, defined in this driver only, and the
 * invariant check fails for it while the supplied deleteRoot passes.
 */
#include <stdbool.h>
#include <stdlib.h>

#include "avl.h"
#include "testing.h"

/* Deterministic pseudo-random permutations, so every run checks the same set
 * of trees and a failure can be reproduced exactly. */
static unsigned long lcg = 20261020UL;

static int nextRandom(int bound) {
    lcg = lcg * 6364136223846793005UL + 1442695040888963407UL;
    return (int) ((lcg >> 33) % (unsigned long) bound);
}

static void shuffle(int a[], int n) {
    for (int i = n - 1; i > 0; i--) {
        int j = nextRandom(i + 1);
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
}

/* AVL height bound: h <= 1.4405 * log2(n + 2) - 0.3277. A tree that is not
 * rebalanced on deletion eventually breaks this. */
static bool heightWithinAvlBound(int height, int n) {
    if (n == 0) return height == -1;
    double bound = 1.4405 * (log((double) n + 2.0) / log(2.0)) - 0.3277;
    return (double) height <= bound + 1e-9;
}

static struct node *buildDiscriminatingTree(void) {
    /* A valid 7-node AVL tree whose root deletion needs a rotation INSIDE the
     * right subtree, on the path the in-order successor was removed from:
     *            10
     *         5      20
     *       3      15  30
     *                    40
     */
    const int values[7] = {10, 5, 20, 3, 15, 30, 40};
    struct node *t = NULL;
    for (int i = 0; i < 7; i++) t = avlInsert(t, values[i]);
    return t;
}

/* A deliberately non-rebalancing helper, for the discrimination check only.
 * It keeps the stored heights up to date but never rotates, which is exactly
 * what "an ordinary unbalanced BST deleteRoot" means. */
static struct node *plainRemoveMin(struct node *t, struct node **minNode) {
    if (t->left == NULL) {
        *minNode = t;
        return t->right;
    }
    t->left = plainRemoveMin(t->left, minNode);
    int lh = t->left == NULL ? -1 : t->left->height;
    int rh = t->right == NULL ? -1 : t->right->height;
    t->height = 1 + (lh > rh ? lh : rh);
    return t;
}

static struct node *plainDeleteRoot(struct node *t) {
    if (t == NULL) return NULL;
    if (t->left == NULL) {
        struct node *r = t->right;
        free(t);
        return r;
    }
    if (t->right == NULL) {
        struct node *l = t->left;
        free(t);
        return l;
    }
    struct node *successor = NULL;
    struct node *newRight = plainRemoveMin(t->right, &successor);
    successor->left = t->left;
    successor->right = newRight;
    free(t);
    int lh = successor->left == NULL ? -1 : successor->left->height;
    int rh = successor->right == NULL ? -1 : successor->right->height;
    successor->height = 1 + (lh > rh ? lh : rh);
    return successor;
}

int main(void) {
    SECTION("deleteRoot: no children, one child, two children");
    {
        struct node *t = avlInsert(NULL, 5);
        t = deleteRoot(t);
        CHECK(t == NULL, "deleting the only node leaves an empty tree");

        t = avlInsert(NULL, 5);
        t = avlInsert(t, 7);
        t = deleteRoot(t);
        CHECK(t != NULL && t->item == 7, "a right child replaces the root");
        CHECK(avlCheck(t), "and the result is a valid AVL tree");
        CHECK(avlNodeHeight(t) == 0, "with the stored height updated");
        avlFree(t);

        t = avlInsert(NULL, 5);
        t = avlInsert(t, 3);
        t = deleteRoot(t);
        CHECK(t != NULL && t->item == 3, "a left child replaces the root");
        CHECK(avlCheck(t), "and the result is a valid AVL tree");
        avlFree(t);

        t = avlInsert(NULL, 5);
        t = avlInsert(t, 3);
        t = avlInsert(t, 8);
        t = deleteRoot(t);
        CHECK(t != NULL && t->item == 8,
              "the in-order successor replaces a two-child root");
        CHECK(avlCheck(t) && avlSize(t) == 2, "the result is valid and smaller");
        CHECK(avlSearch(t, 3) && avlSearch(t, 8) && !avlSearch(t, 5),
              "exactly the deleted value is gone");
        avlFree(t);
    }

    SECTION("deleteRoot rebalances the internal removal path");
    {
        struct node *t = buildDiscriminatingTree();
        CHECK(avlCheck(t), "the starting tree is a valid AVL tree");
        CHECK(avlNodeHeight(t) == 3, "of height 3");

        t = deleteRoot(t);
        CHECK(t != NULL && t->item == 15, "15 is the in-order successor of 10");
        CHECK(avlSize(t) == 6, "six nodes remain");
        CHECK(avlCheck(t),
              "every stored height and every balance factor is still correct");
        CHECK(!avlSearch(t, 10), "10 is gone");
        int order[6];
        int n = avlInorder(t, order, 6);
        bool sorted = n == 6;
        for (int i = 0; i + 1 < n && sorted; i++) {
            if (order[i] >= order[i + 1]) sorted = false;
        }
        CHECK(sorted, "the in-order walk is still strictly increasing");
        avlFree(t);
    }

    SECTION("a plain BST helper would fail this test");
    {
        struct node *t = buildDiscriminatingTree();
        t = plainDeleteRoot(t);
        CHECK(!avlCheck(t),
              "the non-rebalancing helper leaves a broken AVL invariant, "
              "so avlCheck can tell the two helpers apart");
        avlFree(t);
    }

    SECTION("avlDelete: missing key, leaf, one child, two children, root");
    {
        struct node *t = NULL;
        const int values[9] = {50, 25, 75, 10, 30, 60, 90, 5, 80};
        for (int i = 0; i < 9; i++) t = avlInsert(t, values[i]);
        CHECK(avlCheck(t) && avlSize(t) == 9, "nine nodes, valid AVL");

        t = avlDelete(t, 999);
        CHECK(avlSize(t) == 9 && avlCheck(t), "deleting a missing key is a no-op");

        t = avlDelete(t, 5);
        CHECK(avlCheck(t) && !avlSearch(t, 5) && avlSize(t) == 8, "leaf deleted");

        t = avlDelete(t, 10);
        CHECK(avlCheck(t) && !avlSearch(t, 10) && avlSize(t) == 7,
              "one-child node deleted");

        t = avlDelete(t, 75);
        CHECK(avlCheck(t) && !avlSearch(t, 75) && avlSize(t) == 6,
              "two-child node deleted");

        t = avlDelete(t, 50);
        CHECK(avlCheck(t) && !avlSearch(t, 50) && avlSize(t) == 5,
              "the root deleted");

        t = avlDelete(t, 25);
        t = avlDelete(t, 30);
        t = avlDelete(t, 60);
        t = avlDelete(t, 80);
        t = avlDelete(t, 90);
        CHECK(t == NULL, "deleting every remaining value empties the tree");
        CHECK(avlDelete(NULL, 1) == NULL, "deleting from an empty tree is safe");
    }

    SECTION("deterministic stress: insert, delete, invariant after every step");
    {
        int insertOrder[64];
        int deleteOrder[64];
        int expected[64];
        int present[64];

        for (int n = 1; n <= 64; n++) {
            for (int i = 0; i < n; i++) insertOrder[i] = i;
            shuffle(insertOrder, n);
            for (int i = 0; i < n; i++) deleteOrder[i] = i;
            shuffle(deleteOrder, n);

            struct node *t = NULL;
            bool ok = true;
            for (int i = 0; i < n && ok; i++) {
                t = avlInsert(t, insertOrder[i]);
                if (!avlCheck(t)) ok = false;
                if (!heightWithinAvlBound(avlNodeHeight(t), avlSize(t))) ok = false;
            }
            CHECK(ok, "the AVL invariant and height bound hold through inserts");
            CHECK(avlSize(t) == n, "every distinct value was inserted once");

            /* duplicates are ignored */
            t = avlInsert(t, insertOrder[0]);
            CHECK(avlSize(t) == n, "re-inserting an existing value is a no-op");

            for (int i = 0; i < n; i++) present[i] = 1;
            ok = true;
            for (int d = 0; d < n && ok; d++) {
                t = avlDelete(t, deleteOrder[d]);
                present[deleteOrder[d]] = 0;

                if (!avlCheck(t)) ok = false;
                if (!heightWithinAvlBound(avlNodeHeight(t), avlSize(t))) ok = false;

                int want = 0;
                for (int v = 0; v < n; v++) {
                    if (present[v]) expected[want++] = v;
                }
                if (avlSize(t) != want) ok = false;
                int got[64];
                if (avlInorder(t, got, 64) != want) ok = false;
                for (int i = 0; i < want; i++) {
                    if (got[i] != expected[i]) ok = false;
                    if (!avlSearch(t, expected[i])) ok = false;
                }
                if (avlSearch(t, deleteOrder[d])) ok = false;
            }
            CHECK(ok,
                  "the invariant, height bound and contents hold through every "
                  "deletion, including the cascades");
            CHECK(t == NULL, "the tree is empty and fully freed");
        }
    }

    return testReport("test_avl");
}

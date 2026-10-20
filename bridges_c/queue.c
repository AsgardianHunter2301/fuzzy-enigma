/*
 * queue.c - see queue.h. SOURCE LABEL: SUPPLEMENTAL HELPER.
 */
#include "queue.h"

#include <stdio.h>
#include <stdlib.h>

struct queueNode {
    Vertex v;
    struct queueNode *next;
};

struct queue {
    struct queueNode *front;
    struct queueNode *back;
    int size;
};

Queue QueueNew(void) {
    Queue q = malloc(sizeof(*q));
    if (q == NULL) {
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }
    q->front = NULL;
    q->back = NULL;
    q->size = 0;
    return q;
}

void QueueFree(Queue q) {
    if (q == NULL) {
        return;
    }
    struct queueNode *curr = q->front;
    while (curr != NULL) {
        struct queueNode *next = curr->next;
        free(curr);
        curr = next;
    }
    free(q);
}

void QueueEnqueue(Queue q, Vertex v) {
    struct queueNode *node = malloc(sizeof(*node));
    if (node == NULL) {
        fprintf(stderr, "error: out of memory\n");
        exit(EXIT_FAILURE);
    }
    node->v = v;
    node->next = NULL;

    if (q->back == NULL) {
        q->front = node;
    } else {
        q->back->next = node;
    }
    q->back = node;
    q->size++;
}

Vertex QueueDequeue(Queue q) {
    if (q->front == NULL) {
        fprintf(stderr, "error: QueueDequeue: queue is empty\n");
        exit(EXIT_FAILURE);
    }

    struct queueNode *node = q->front;
    Vertex v = node->v;
    q->front = node->next;
    if (q->front == NULL) {
        q->back = NULL;
    }
    free(node);
    q->size--;
    return v;
}

int QueueSize(Queue q) {
    return q->size;
}

bool QueueIsEmpty(Queue q) {
    return q->size == 0;
}

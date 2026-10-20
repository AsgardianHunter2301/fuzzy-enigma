/*
 * queue.h - the Vertex queue the BFS bridge assumes.
 *
 * SOURCE LABEL: SUPPLEMENTAL HELPER (authored for the remediation).
 *
 * The BFS bridge's conversion note says "Queue stores Vertex values", but no
 * Queue ADT is bundled with the bridges, so BFS could not be compiled as shown
 * (part of finding BRG-05). This is a minimal FIFO queue of Vertex values.
 *
 * Contract: QueueNew returns an owning handle; the caller must call QueueFree
 * exactly once, which releases every node still queued. QueueDequeue on an
 * empty queue is a programming error and terminates the program rather than
 * returning an in-band value, because every Vertex is a legal item.
 */
#ifndef BRIDGES_C_QUEUE_H
#define BRIDGES_C_QUEUE_H

#include <stdbool.h>

#include "graph_unweighted.h" /* Vertex */

typedef struct queue *Queue;

Queue QueueNew(void);
void QueueFree(Queue q);
void QueueEnqueue(Queue q, Vertex v);
Vertex QueueDequeue(Queue q);
int QueueSize(Queue q);
bool QueueIsEmpty(Queue q);

#endif /* BRIDGES_C_QUEUE_H */

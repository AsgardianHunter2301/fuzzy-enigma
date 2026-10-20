/*
 * radix_sort.h - the radix sort bridge.
 *
 * SOURCE LABEL: SUPPLEMENTAL C. The matching pseudocode is in the 26T2 manual;
 * this C conversion is not. Learn it separately.
 *
 * Declared contract (from the bridge's conversion note): every key has exactly
 * m symbols, and symbolIndex(key, position) returns a bucket number in
 * 0 .. R - 1 for position 0 .. m - 1. Keys are sorted in place; the array and
 * the strings it points at stay owned by the caller.
 *
 * Reviewed-unchanged by the bridge remediation: no finding was raised against
 * this body. It is compiled and tested here so that "complete C" is a checked
 * claim rather than an assumption.
 */
#ifndef BRIDGES_C_RADIX_SORT_H
#define BRIDGES_C_RADIX_SORT_H

typedef const char *Key;
typedef int (*SymbolIndex)(Key key, int position);

void radixSort(Key A[], int n, int m, int R, SymbolIndex symbolIndex);

#endif /* BRIDGES_C_RADIX_SORT_H */

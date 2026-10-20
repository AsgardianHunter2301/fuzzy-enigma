/*
 * testing.h - the tiny check harness the bridge drivers use.
 *
 * CHECK counts every expectation and prints the file, line, message and
 * expression of each failure; testReport returns a non-zero value when any
 * check failed, which each main() returns as the process exit status. assert()
 * is deliberately not used, so -DNDEBUG cannot silently empty a test.
 */
#ifndef BRIDGES_C_TESTING_H
#define BRIDGES_C_TESTING_H

#include <math.h>
#include <stdio.h>

static int testChecks = 0;
static int testFailures = 0;

#define CHECK(cond, msg)                                                    \
    do {                                                                    \
        testChecks++;                                                       \
        if (!(cond)) {                                                      \
            testFailures++;                                                 \
            printf("  FAIL %s:%d  %s  [%s]\n", __FILE__, __LINE__, (msg),   \
                   #cond);                                                  \
        }                                                                   \
    } while (0)

#define SECTION(name) printf("-- %s\n", (name))

/* Weights are doubles, so equality checks use a tolerance. The test data uses
 * exact binary fractions, so the tolerance only guards accumulation order. */
#define NEARLY(a, b) (fabs((double) (a) - (double) (b)) <= 1e-12)

static int testReport(const char *suite) {
    printf("%s: %d checks, %d failures\n", suite, testChecks, testFailures);
    return testFailures == 0 ? 0 : 1;
}

#endif /* BRIDGES_C_TESTING_H */

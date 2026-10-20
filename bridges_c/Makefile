# bridges_c - corrected supplemental C bridges for the COMP2521 study app.
#
#   make            build and run everything, rewrite RESULTS.txt (build.sh)
#   make quick      strict build and run only, do not rewrite RESULTS.txt
#   make parity     compile the bridge text the app displays, and compare it
#                   with the code compiled here
#   make clean      remove the build directory
#
# ADT selects which copy of the read-only supplied Graph ADTs to compile
# against. The default is the pinned baseline copy, which cannot change under
# the build; override with `make ADT=../memorise_graph_c`.

ADT ?= ../../baseline_pristine/memorise_graph_c
CC ?= gcc
STRICT = -std=c11 -Wall -Wextra -Wpedantic -Werror
SANITIZE = -std=c11 -O1 -g -fsanitize=address,undefined -fno-sanitize-recover=all

.PHONY: all quick parity clean
all:
	./build.sh

quick:
	./build.sh --quick

parity:
	ADT=$(ADT) ./verify_displayed_bridges.sh

clean:
	rm -rf ./_build

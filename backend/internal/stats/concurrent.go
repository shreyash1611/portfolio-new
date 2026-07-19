package stats

import (
	"errors"
	"sync"
)

// task is a unit of work that can fail.
type task func() error

// runConcurrently runs every task in its own goroutine and waits for all
// of them to finish, joining every error that occurred (not just the
// first one) into a single combined error via errors.Join (Go 1.20+).
//
// Note there's no mutex anywhere here: each goroutine writes only to its
// own index of errs (index i, exactly once), and each task closure below
// writes only to its own captured result variable. Concurrent writes to
// *different* memory locations are safe without synchronization -- it's
// only concurrent access to the *same* memory that needs a mutex/channel.
func runConcurrently(tasks ...task) error {
	var wg sync.WaitGroup
	errs := make([]error, len(tasks))

	for i, t := range tasks {
		wg.Add(1)
		go func(i int, t task) {
			defer wg.Done()
			errs[i] = t()
		}(i, t)
	}
	wg.Wait()

	return errors.Join(errs...)
}

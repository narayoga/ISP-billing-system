package netstatus

import (
	"context"
	"sync"
	"time"
)

type memEntry struct {
	state   string
	expires time.Time
}

// Memory store in-memory dengan expiry per-key (dev tanpa Redis).
type Memory struct {
	mu sync.RWMutex
	m  map[int64]memEntry
}

func NewMemory() *Memory { return &Memory{m: make(map[int64]memEntry)} }

func (s *Memory) Set(_ context.Context, customerID int64, state string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[customerID] = memEntry{state: state, expires: time.Now().Add(TTLSeconds * time.Second)}
	return nil
}

func (s *Memory) GetAll(_ context.Context) (map[int64]string, error) {
	now := time.Now()
	out := make(map[int64]string)
	s.mu.Lock()
	defer s.mu.Unlock()
	for id, e := range s.m {
		if now.After(e.expires) {
			delete(s.m, id) // lazy expiry
			continue
		}
		out[id] = e.state
	}
	return out, nil
}

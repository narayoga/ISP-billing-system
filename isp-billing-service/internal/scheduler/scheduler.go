package scheduler

import (
	"sync"
	"time"
)

// Job = pekerjaan harian. DayOfMonth 0 berarti setiap hari; selain itu hanya
// berjalan pada tanggal tersebut. Job dijalankan sekali per hari pada tick
// pertama setelah jam:menit terlewati (tahan terhadap drift ticker / restart).
type Job struct {
	Name       string
	DayOfMonth int
	Hour       int
	Minute     int
	Run        func()
}

type Scheduler struct {
	jobs    []Job
	loc     *time.Location
	mu      sync.Mutex
	lastRun map[string]string // name -> "2006-01-02"
}

func New(loc *time.Location, jobs ...Job) *Scheduler {
	return &Scheduler{jobs: jobs, loc: loc, lastRun: make(map[string]string)}
}

// Start menjalankan loop ticker 1 menit di goroutine terpisah.
func (s *Scheduler) Start() {
	go func() {
		s.tick(time.Now().In(s.loc))
		t := time.NewTicker(time.Minute)
		defer t.Stop()
		for now := range t.C {
			s.tick(now.In(s.loc))
		}
	}()
}

func (s *Scheduler) tick(now time.Time) {
	today := now.Format("2006-01-02")
	for _, j := range s.jobs {
		if j.DayOfMonth != 0 && now.Day() != j.DayOfMonth {
			continue
		}
		sched := time.Date(now.Year(), now.Month(), now.Day(), j.Hour, j.Minute, 0, 0, s.loc)
		if now.Before(sched) {
			continue
		}
		s.mu.Lock()
		shouldRun := s.lastRun[j.Name] != today
		if shouldRun {
			s.lastRun[j.Name] = today
		}
		s.mu.Unlock()
		if shouldRun {
			go j.Run()
		}
	}
}

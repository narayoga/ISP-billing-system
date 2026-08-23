package netstatus

import (
	"context"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// Redis store: key network_status:{customer_id}, TTL 60s (PRD §7).
//
// CATATAN: hanya terverifikasi sampai kompilasi (tidak ada Redis di environment
// build). Aktif saat REDIS_URL diisi.
type Redis struct {
	client *redis.Client
}

func NewRedis(url string) (*Redis, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opt)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	return &Redis{client: client}, nil
}

const keyPrefix = "network_status:"

func key(customerID int64) string { return keyPrefix + strconv.FormatInt(customerID, 10) }

func (s *Redis) Set(ctx context.Context, customerID int64, state string) error {
	return s.client.Set(ctx, key(customerID), state, TTLSeconds*time.Second).Err()
}

func (s *Redis) GetAll(ctx context.Context) (map[int64]string, error) {
	out := make(map[int64]string)
	iter := s.client.Scan(ctx, 0, keyPrefix+"*", 100).Iterator()
	for iter.Next(ctx) {
		k := iter.Val()
		val, err := s.client.Get(ctx, k).Result()
		if err == redis.Nil {
			continue
		}
		if err != nil {
			return nil, err
		}
		id, err := strconv.ParseInt(k[len(keyPrefix):], 10, 64)
		if err != nil {
			continue
		}
		out[id] = val
	}
	if err := iter.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

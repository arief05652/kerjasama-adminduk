const clients = new Set()

export function addClient(res) {
  clients.add(res)
  res.write('retry: 3000\n\n')
}

export function removeClient(res) {
  clients.delete(res)
}

export function broadcast(type = 'change') {
  const payload = `event: ${type}\ndata: ${JSON.stringify({
    type,
    at: Date.now(),
  })}\n\n`
  for (const res of clients) {
    try {
      res.write(payload)
    } catch {
      clients.delete(res)
    }
  }
}

// Heartbeat supaya koneksi tidak diputus proxy/idle timeout
setInterval(() => {
  for (const res of clients) {
    try {
      res.write(': ping\n\n')
    } catch {
      clients.delete(res)
    }
  }
}, 25000).unref?.()

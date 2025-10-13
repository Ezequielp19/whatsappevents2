import Pusher from 'pusher-js'

const pusher = new Pusher('0bd455430523b265ba9f', {
  cluster: 'us2',
  enabledTransports: ['ws', 'wss'],
  forceTLS: true
})

export default pusher

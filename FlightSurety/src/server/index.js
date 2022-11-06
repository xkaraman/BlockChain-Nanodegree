
import http from 'http'
import app from './server'

const server = http.createServer(app)
let currentApp = app
server.listen(3000, async () => {
    console.log('Oracle Server App running on port 3000...');
    console.log('GET /logs for server log history');
    console.log('GET /oracles for registered oracles');
    console.log('-----------------------------------------');
    console.log('v               LOGS                    v');
    console.log('-----------------------------------------');
})

if (module.hot) {
    module.hot.accept('./server', () => {
        server.removeListener('request', currentApp)
        server.on('request', app)
        currentApp = app
    })
}

import http from 'http'
import express, { Response, Request, NextFunction} from 'express'
import cors from 'cors'
import {createLogger, LoggerOptions } from 'bunyan'
import geoip from 'geoip-lite'
import config from './config'


const log = createLogger(config.logger.options as LoggerOptions)
const app = express()
const server = new http.Server(app)

const startServer = async(portToListenOn=config.server.port) => {
  return await new Promise((resolve, reject) => {
    try {
      app.disable('x-powered-by')

      // https://expressjs.com/en/guide/behind-proxies.html
      app.set('trust proxy', 1)
      app.use(cors())

      app.get('/me', function meRoute(req: Request, res: Response) {
        // https://devcenter.heroku.com/articles/http-routing#heroku-headers
        const realClientIpAddress = ((req.headers['x-forwarded-for'] || req.ip || "") as string).split(',')
        const ip = realClientIpAddress[realClientIpAddress.length - 1]
        console.log(ip)
        res.json({ ip, ...geoip.lookup(ip) })
      })

      app.get('/:ip', function ipRoute(req: Request, res: Response) {
        res.json({ ip: req.params.ip, ...geoip.lookup(req.params.ip) })
      })

      app.all('*', function fallbackRoute(req: Request, res: Response) {
        res.redirect('/me')
      })

      app.use(function expressErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
        log.error('Express error handling', err)
        res.sendStatus(500)
      })

      server.listen(portToListenOn, () => {
        log.info(`listening on *: ${portToListenOn}`)
        resolve(app)
      })

    } catch(err) {
      log.error("Error starting server", err)
      reject(err)
    }
  })
}

export default startServer;
import startServer from './server'

;(async() => {
  try {
    await startServer()
  } catch(err) {
    process.exit()
  }
})()
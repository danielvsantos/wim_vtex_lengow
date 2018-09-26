import { compose, reduce, values } from 'ramda'

const hrToNano = ([seconds, nanoseconds]: [number, number]) => seconds * 1e9 + nanoseconds
const timePercent = (time, total) => ((time * 100) / total).toFixed(2) + '%'
const formatTime = ([seconds, nanoseconds]: [number, number]): string => `${seconds}s ${(nanoseconds / 1000000).toFixed(0)}ms`
const totalNanoseconds = compose<Timings, [number, number][], number>(reduce((acc: number, hr: [number, number]) => acc + hrToNano(hr), 0), values)

const middlewareStats = ({ name }, time) => ({
    name,
    time: `[${time}]`,
})

const printStats = ({ timings, logger }): void => {
    const total = totalNanoseconds(timings)
    const entries = {}
    Object.keys(timings).forEach(k => {
        const nano = hrToNano(timings[k])
        entries[k] = { time: formatTime(timings[k]), percent: timePercent(nano, total) }
    })
    logger.log('Middlerwares stats', 'info', entries)
}

export default function timer(middleware) {
    return async (step, next: () => Promise<void>) => {
        if (!step.timings) { step.timings = {} }
        const start = process.hrtime()
        await middleware(step, async () => {
            try {
                const end = process.hrtime(start)
                const { name, time } = middlewareStats(middleware, formatTime(end))
                step.logger.log(`Middlerware ${name} stats ${time}`, 'info', { name, time })
                step.timings[middleware.name] = end
            } catch (e) {
                console.log('Error while logging', e)
            }
            await next()
        })
        if (step.timings) {
            printStats(step)
            delete step.timings
        }
    }
}

// Mule: 211 minerals per minute (real time), source: https://youtu.be/kmxeG8I5p1Y?t=14s
// source: http://www.teamliquid.net/forum/sc2-strategy/140055-scientifically-measuring-mining-speed

const incomeMinerals = (workers: number, bases: number, mules = 0): number => {
    // Returns mineral income per second.
    if ((workers === 0 && mules === 0) || bases === 0) {
        return 0
    }

    // How many close and far mineral patches there are per base
    const amount_close_patches = 4
    const amount_far_patches = 4
    const full_saturation = 3 * (amount_close_patches + amount_far_patches)

    // Ignore workers that oversaturate a base (more than 24 workers)
    workers = Math.min(full_saturation * bases, workers)
    if (bases > 1) {
        const w1 = Math.floor(workers / bases)
        const w2 = workers % bases
        const base1Income = incomeMinerals(w1 + w2, 1, mules)
        const otherBasesIncome = incomeMinerals(w1, 1) * (bases - 1)
        return base1Income + otherBasesIncome
    }

    let third_worker_close_patch = 0
    let third_worker_far_patch = 0
    let workers_far_patch = 0

    const income_three_workers = 145
    const income_workers_far_patch = 54.75
    const income_third_worker_far_patch = Math.max(0, income_three_workers - 2*income_workers_far_patch)
    const income_workers_close_patch = 62.5
    const income_third_worker_close_patch = Math.max(0, income_three_workers - 2*income_workers_close_patch)

    //////////////// optimal saturation ////////////////
    //// Add workers as third workers to close patches
    //const threshold_far_third_workers = full_saturation - amount_close_patches
    //if (workers > threshold_far_third_workers) {
    //    third_worker_close_patch = workers - threshold_far_third_workers
    //    workers = threshold_far_third_workers
    //}
    //const threshold_far_patch_worker = 2*(amount_close_patches + amount_far_patches);
    //if (workers > threshold_far_patch_worker) {
    //    third_worker_far_patch = workers - threshold_far_patch_worker
    //    workers = threshold_far_patch_worker
    //}
    //const threshold_close_patch_worker = amount_close_patches*2;
    //if (workers > threshold_close_patch_worker) {
    //    workers_far_patch = workers - threshold_close_patch_worker
    //    workers = threshold_close_patch_worker
    //}
    //// Remaining workers are on close patch
    //const workers_close_patch = workers
    //////////////// optimal saturation ////////////////
    
    //////////////// human saturation ////////////////
    //workers_far_patch = Math.floor(workers*amount_far_patches/(amount_far_patches+amount_close_patches))
    //workers = workers - workers_far_patch
    //if( workers_far_patch > amount_far_patches*2) {
    //    third_worker_far_patch = workers_far_patch - amount_far_patches*2
    //    workers_far_patch = amount_far_patches*2
    //}
    //if( workers > amount_close_patches*2) {
    //    third_worker_close_patch = workers - amount_close_patches*2
    //    workers = amount_close_patches*2
    //}
    //const workers_close_patch = workers
    //////////////// human saturation ////////////////
    //////////////// bad saturation ////////////////
    //const start_workers = workers
    let workers_left = workers
    // allocate up to 2 to far patches
    if( workers_left > amount_far_patches*2 ) {
        workers_far_patch = amount_far_patches*2
        workers_left -= amount_far_patches*2
    } else {
        workers_far_patch = workers_left
        workers_left = 0
    }
    // allocate up to 2 to close patches
    if( workers_left > amount_close_patches*2 ) {
        workers = amount_close_patches*2
        workers_left -= amount_close_patches*2
    } else {
        workers  = workers_left
        workers_left = 0
    }
    const workers_close_patch = workers
    // allocate 3rd workers to near patch
    if( workers_left > amount_close_patches ) {
        third_worker_close_patch = amount_close_patches
        workers_left -= amount_close_patches
    }
    else {
        third_worker_close_patch = workers_left
        workers_left = 0
    }
    // allocate 3rd workers to far patch
    third_worker_far_patch = Math.min(workers_left,amount_far_patches)
    ////////////// bad saturation ////////////////

    //console.log(start_workers + " " + workers_far_patch + " " + workers_close_patch + " " + third_worker_close_patch + " " + third_worker_far_patch)

    let income_per_min = 0
    const array = [
        workers_close_patch * income_workers_close_patch,
        workers_far_patch * income_workers_far_patch,
        third_worker_far_patch * income_third_worker_far_patch,
        third_worker_close_patch * income_third_worker_close_patch,
    ]
    array.forEach((value) => {
        income_per_min += value
    })

    // Income per second
    const mule_rate = 225 / 64
    return income_per_min / 60 + mules * mule_rate
}

const incomeVespenePerGeyser = (workers: number): number => {
    // Returns vespene income per second for one geyser.
    if (workers === 0) {
        return 0
    }
    if (workers == 3 ) {
        //saturation income
        return 2.7
    }
    return workers*0.9833
}

const incomeVespene = (workers: number, geysers: number, baseCount: number): number => {
    // Returns vespene income per second.

    if (workers === 0 || geysers === 0) {
        return 0
    }
    const closeGeysers = Math.min(geysers, baseCount * 2)
    const closeDistanceWorkers = Math.min(3 * closeGeysers, workers)
    const minWorkersPerGeyser = Math.floor(closeDistanceWorkers / closeGeysers)
    const workersLeft = closeDistanceWorkers % closeGeysers
    const closeDistanceIncome =
        closeGeysers * incomeVespenePerGeyser(minWorkersPerGeyser) +
        workersLeft *
            (incomeVespenePerGeyser(minWorkersPerGeyser + 1) -
                incomeVespenePerGeyser(minWorkersPerGeyser))

    let longDistanceIncome = 0
    workers -= closeDistanceWorkers
    geysers -= closeGeysers
    const longDistanceMiningRatio = [8.175, 8.95, 10.4, 14.8] //Distance from long distance geyser divided by distance from base geyser
    for (const miningRatio of longDistanceMiningRatio) {
        if (geysers > 0) {
            geysers--
            const longDistanceWorkers = Math.min(Math.floor(miningRatio * 3), workers)
            if (longDistanceWorkers > 0) {
                workers -= longDistanceWorkers
                longDistanceIncome +=
                    (incomeVespenePerGeyser(3) * longDistanceWorkers) / 3 / miningRatio
            }
        }
    }
    return closeDistanceIncome + longDistanceIncome
}

export { incomeMinerals, incomeVespene }

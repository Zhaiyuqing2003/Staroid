that.setup = function() {
}
that.update = function() {
	let worker = this["unit"]["worker"]
	let home = this["building"][0]
	let melee = this["unit"]["melee"]
	let ore = context["resource"]["ore"][1]
	if (worker.length < 3){
		if (home.hasPlan()){
			home.produce(this)
		} else {
			home.plan("worker")
		}
	} else {
		if (home.hasPlan()){
			home.produce(this)
		} else {
			home.plan("melee")
		}
	}
	for (let i in worker){
		if (worker[i].hasRoute){
			worker[i].doRoute()
		} else {
			worker[i].createRoute(ore,home,"mine")
		}
	}
	for (let i in melee){
		let validate = 0
		for (let j in worker){
			validate = j
			break
		}
		melee[i].attack(worker[validate])
	}
}
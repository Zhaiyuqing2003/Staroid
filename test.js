that.setup = function() {
	this["worker"] = []
	this["melee"] = []
}
that.update = function() {
	let worker = this["worker"]
	let home = this["home"]
	let melee = this["melee"]
	let ore = context["resource"]["ore"][1]
	if (worker.length < 3){
		if (home.hasPlan()){
			home.produce(function(_worker){
				worker.push(_worker)
			})
		} else {
			home.plan("worker")
		}
	} else {
		if (home.hasPlan()){
			home.produce(function(_melee){
				melee.push(_melee)
			})
		} else {
			home.plan("melee")
		}
	}
	for (let i in worker){
		if (worker[i].status == false){ break }
		if (worker[i].hasRoute){
			worker[i].doRoute()
		} else {
			worker[i].createRoute(ore,home,"mine")
		}
	}
	for (let i in melee){
		let validate = 0
		for (let j in worker){
			if (worker[j].status == false){
				validate = j
				break
			}
		}
		melee[i].attack(worker[validate])
	}
}
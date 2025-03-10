const ParallelError = require("../errors/ParallelError")

// use this when creating several promises that will be waited for in parallel.
// assignmentFunc is a function that will assign the value from a resolved promise to a variable.
// Any errors caught will be wrapped in ParallelError so that the provided key can be returned
// in order to map the failing promise to it's source
const parallelPrep  = async (obj, key, promise) => {
   try {
      obj[key] = await promise
   } catch (e) {
      throw new ParallelError(e, key)
   }
}
const parallelAssignReturnErrors = async (array) => (await Promise.allSettled(array)).filter(result => result.status === 'rejected').map(reject => reject.reason)

module.exports = {
   parallelPrep,
   parallelAssignReturnErrors
}
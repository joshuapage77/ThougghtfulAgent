class ParallelError extends Error {
   constructor(error, id) {
      super(error.message) // Pass original error message to base Error class
      this.name = 'ParallelError'
      this.id = id
      this.originalError = error // Preserve the original error object
      if (error.stack) this.stack = `${this.name}: ${error.message}\n${error.stack}`
   }
}

module.exports = ParallelError
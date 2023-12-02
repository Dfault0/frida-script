function print_stacks() {
    const Throwable = Java.classFactory.use("java.lang.Throwable")
    let result = "\n=======strack trace=======\n"
    const ex = Throwable.$new()
    const stackElements = ex.getStackTrace()
    if (stackElements) {
        result += stackElements[0] + "\n"
        for (let i = 1; i < stackElements.length; i++) {
            result += "\t" + stackElements[i] + "\n"
        }
    }

    result += "======= Done =======\n"
    console.log(result)
    ex.$dispose()
}
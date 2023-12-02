function hook_registerNative(){
    var RegisterNatives_addr;

    var symbols = Process.findModuleByName("libart.so").enumerateSymbols()
    // console.log(JSON.stringify(symbols))
    for(var i =0;i<symbols.length;i++){
        var symbol = symbols[i];
        if(symbol.name.indexOf("RegisterNatives")!=-1 && symbol.name.indexOf("CheckJNI")==-1){
            console.log("symbol:",JSON.stringify(symbol))
            RegisterNatives_addr = symbols[i].address
            console.log("find RegisterNatives and addr is:",RegisterNatives_addr)
        }
    }

    if(RegisterNatives_addr==null){
        console.log("not find the RegisterNatives!")
        return;
    }
    Interceptor.attach(RegisterNatives_addr,{
        onEnter:function(args){
            //jint RegisterNatives(jclass clazz, const JNINativeMethod* methods,jint nMethods)
            console.log("registernative method counts:",args[3])
            var env = args[0]
            var jclass = args[1]
            var class_name = Java.vm.getEnv().getClassName(jclass)
            console.log("class name:",class_name)

            //打印出注册的函数的前面，地址，so文件名字，基址，偏移地址等
            var methods_ptr = args[2]
            var method_count = parseInt(args[3]);
            for (var i = 0; i < method_count; i++) {
                var name_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3));
                var sig_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize));
                var fnPtr_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize * 2));
                var name = Memory.readCString(name_ptr);
                var sig = Memory.readCString(sig_ptr);
                var find_module = Process.findModuleByAddress(fnPtr_ptr);
                console.log("[RegisterNatives] java_class:", class_name, "name:", name, "sig:", sig, "fnPtr:", fnPtr_ptr, "module_name:", find_module.name, "module_base:", find_module.base, "offset:", ptr(fnPtr_ptr).sub(find_module.base));
            }
        },onLeave:function(retval){

        }
    })

}
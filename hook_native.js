function hook_native(){
    var native_lib_addr = Module.findBaseAddress("libnative-lib.so")
    console.log("native_lib_addr:",native_lib_addr)
    //Java_com_example_demoso1_MainActivity_myfirstjni
    var myfirstjniJNI_addr = Module.findExportByName("libnative-lib.so","Java_com_example_demoso1_MainActivity_myfirstjniJNI")
    console.log("myfirstjni_addr: ",myfirstjniJNI_addr)
    //if we want to invoke  a special function, we must find this function addr first.
    var myfirstjniJNI_invoke = new NativeFunction(myfirstjniJNI_addr,"pointer",["pointer","pointer","pointer"])
    
    Interceptor.attach(myfirstjniJNI_addr,{
        onEnter:function(args){
            console.log("Interceptor attach myfirstjni args:",args[0],args[1],args[2])
            
            //invoke         
            var invoke_result = myfirstjniJNI_invoke(args[0],args[1],args[2])
            console.log("invoke_result:",invoke_result)
            console.log("myfirstjniJNI invoked! result:",Java.vm.getEnv().getStringUtfChars(invoke_result,null).readCString())
        
            // console.log("myfirstjniJNI called from :"+Thread.backtrace(this.context,Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n')+'\n')
            //the next to line code can cause process crashed 

            var newArgs2  = Java.vm.getEnv().newStringUtf("new  newArgs2 from frida!")
            args[2] = newArgs2

        },onLeave:function(retval){
            console.log("Interceptor attach myfirstjni retval:",retval)
            console.log("retval is:",Java.vm.getEnv().getStringUtfChars(retval,null).readCString())
            var newRetval  = Java.vm.getEnv().newStringUtf("new  retval from frida!")
            retval.replace(newRetval)
            //retval.replace(ptr(newRetval))
        }
    })
}
function hook_replace(){
    var native_lib_addr = Module.findBaseAddress("libnative-lib.so")
    console.log("native_lib_addr:",native_lib_addr)
    //Java_com_example_demoso1_MainActivity_myfirstjni
    var myfirstjniJNI_addr = Module.findExportByName("libnative-lib.so","Java_com_example_demoso1_MainActivity_myfirstjniJNI")
    console.log("myfirstjni_addr: ",myfirstjniJNI_addr)
    //if we want to invoke  a special function, we must find this function addr first.
    var myfirstjniJNI_invoke = new NativeFunction(myfirstjniJNI_addr,"pointer",["pointer","pointer","pointer"])
    
    //replace function
    Interceptor.replace(myfirstjniJNI_addr, new NativeCallback(function(args0,args1,args2){
        console.log("Interceptor replace myfirstjni args:",args0,args1,args2)
        //invoke         
        var invoke_result = myfirstjniJNI_invoke(args0,args1,args2)
        console.log("invoke_result:",invoke_result)
        console.log("myfirstjniJNI invoked! result:",Java.vm.getEnv().getStringUtfChars(invoke_result,null).readCString())
        return Java.vm.getEnv().newStringUtf("new  retval from frida replace!")

    },"pointer",["pointer","pointer","pointer"]))
}
function hoook_invoke_native_add(){
    var native_lib_addr = Module.findBaseAddress("libnative-lib.so")
    console.log("native_lib_addr:",native_lib_addr)
    //Java_com_example_demoso1_MainActivity_myfirstjni
    // there the function name was changed by name moungling,so we can use objection to find this export name
    //or we can load this so file to ida,the ida will automatic to decode the function name
    var add_addr = Module.findExportByName("libnative-lib.so","_Z5r0addii")
    console.log("add addr: ",add_addr)
    var add = new NativeFunction(add_addr,'int',['int','int'])
    var add_result = add(50,1)
    console.log('invoke result: ',add_result)

}
function enmurateAllExports(target){
    var modules = Process.enumerateModules();
    // console.log("Process.enumerateModules():",JSON.stringify(modules))
    for(var i = 0;i<modules.length;i++){
        var module = modules[i];
        var module_name = module.name
        if(module_name.indexOf(target)!=-1){
            console.log("modele:",JSON.stringify(module))
            console.log('module name:',module_name)
            var exports = module.enumerateExports();
            for(var j = 0;j<exports.length;j++){
                //exports: {"type":"function","name":"_ZNSt9bad_allocD0Ev","address":"0x75dca1aeb0"}
                console.log("exports:",JSON.stringify(exports[j]))
            }
        }
    }
}
function main(){
    hook_native()
}
setImmediate(main)
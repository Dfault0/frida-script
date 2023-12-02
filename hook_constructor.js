function hook_constructor() {
    if (Process.pointerSize == 4) {
        var linker = Process.findModuleByName("linker");
    } else {
        var linker = Process.findModuleByName("linker64");
    }
 
    var addr_call_function =null;
    var addr_g_ld_debug_verbosity = null;
    var addr_async_safe_format_log = null;
    if (linker) {
        //console.log("found linker");
        var symbols = linker.enumerateSymbols();
        for (var i = 0; i < symbols.length; i++) {
            var name = symbols[i].name;
            if (name.indexOf("call_function") >= 0){
                addr_call_function = symbols[i].address;
               console.log("call_function",JSON.stringify(symbols[i]));
            }
            else if(name.indexOf("g_ld_debug_verbosity") >=0){
                addr_g_ld_debug_verbosity = symbols[i].address;
 
                ptr(addr_g_ld_debug_verbosity).writeInt(2);
 
            } else if(name.indexOf("async_safe_format_log") >=0 && name.indexOf('va_list') < 0){
               // console.log("async_safe_format_log",JSON.stringify(symbols[i]));
                addr_async_safe_format_log = symbols[i].address;
 
            }
 
        }
    }
    if (addr_call_function) {
        console.log("addr_call_function:",addr_call_function)
        Interceptor.attach(addr_call_function, {
            onEnter: function (args) {
                console.log("on enter addr_call_function")
                this.type = ptr(args[0]).readCString();
                console.log(this.type,args[1],args[2],args[3])
                if (this.type == "DT_INIT_ARRAY") {
                    this.count = args[2];
                    //this.addrArray = new Array(this.count);
                    this.path = ptr(args[3]).readCString();
                    var strs = new Array(); //定义一数组
                    strs = this.path.split("/"); //字符分割
                    this.filename = strs.pop();
                    if(this.count > 0){
                        console.log("path : ", this.path);
                        console.log("filename : ", this.filename);
                    }
                    for (var i = 0; i < this.count; i++) {
                        console.log("offset : init_array["+i+"] = ", ptr(args[1]).add(Process.pointerSize*i).readPointer().sub(Module.findBaseAddress(this.filename)));
                        //插入hook init_array代码
                    }
                }
            },
            onLeave: function (retval) {
 
            }
        });
    }
    if(addr_async_safe_format_log){
        console.log("addr_async_safe_format_log:",addr_async_safe_format_log)
        Interceptor.attach(addr_async_safe_format_log,{
            onEnter: function(args){
                this.log_level  = args[0];
                this.tag = ptr(args[1]).readCString()
                this.fmt = ptr(args[2]).readCString()
                if(this.fmt.indexOf("c-tor") >= 0 && this.fmt.indexOf('Done') < 0){
                    this.function_type = ptr(args[3]).readCString(), // func_type
                    this.so_path = ptr(args[5]).readCString();
                    var strs = new Array(); //定义一数组
                    strs = this.so_path.split("/"); //字符分割
                    this.so_name = strs.pop();
                    this.func_offset  = ptr(args[4]).sub(Module.findBaseAddress(this.so_name))
                     console.log("func_type:", this.function_type,
                        '\nso_name:',this.so_name,
                        '\nso_path:',this.so_path,
                        '\nfunc_offset:',this.func_offset
                     );
                   // hook代码在这加
                }
            },
            onLeave: function(retval){
            }
        })
    }
}
/**
 * 明确是哪一个so文件存在反调试
 */
function hook_dlopen() {
    Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"),
        {
            onEnter: function (args) {
                var pathptr = args[0];
                if (pathptr !== undefined && pathptr != null) {
                    var path = ptr(pathptr).readCString();
                    console.log("load " + path);
                }
            }
        }
    );
}
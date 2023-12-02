function hookcipher() {
    Java.perform(function () {
        Java.use('javax.crypto.Cipher').getInstance.overload('java.lang.String').implementation = function (arg0) {
            console.log('javax.crypto.Cipher.getInstance is called!', arg0);
            var result = this.getInstance(arg0);
            return result;
        };
        //.init(Cipher.ENCRYPT_MODE, getRawKey(key), iv);
        Java.use('javax.crypto.Cipher').init.overload('int', 'java.security.Key', 'java.security.spec.AlgorithmParameterSpec').implementation = function (arg0, arg1, arg2) {
            //console.log('javax.crypto.Cipher.init is called!', arg0, arg1, arg2);
            var mode = arg0;
            var key = arg1;
            var iv = arg2;
            var KeyClass = Java.use('java.security.Key');

            var keyobj = Java.cast(key, KeyClass);
            var key_bytes = keyobj.getEncoded();
            var keyString = Java.use("java.lang.String").$new(key_bytes)
            console.log("keyString:",keyString)
            var IVClass = Java.use('javax.crypto.spec.IvParameterSpec');
            var ivobj = Java.cast(iv, IVClass);
            var iv_bytes = ivobj.getIV();
            var ivString = Java.use("java.lang.String").$new(iv_bytes)
            console.log("ivString:",ivString)
            console.log('javax.crypto.Cipher.init is called!')
            // console.log('javax.crypto.Cipher.init is called!', mode, JSON.stringify(key_bytes), JSON.stringify(iv_bytes));
            var result = this.init(arg0, arg1, arg2);
            return result;
        };
        Java.use('javax.crypto.Cipher').doFinal.overload('[B').implementation = function (arg0) {
            // console.log('javax.crypto.Cipher.doFinal is called!', JSON.stringify(arg0));
            var data = arg0;
            var dataString = Java.use("java.lang.String").$new(data)
            console.log('datastring:',dataString)
            var result = this.doFinal(arg0);
            console.log('javax.crypto.Cipher.doFinal is called!')
            // console.log('javax.crypto.Cipher.doFinal is called!', JSON.stringify(data), "encrypt:", JSON.stringify(result));
            return result;
        };
        //doFinal

    })

}
function hookCRC32(){
    if(Java.available){
        Java.perform(function(){
            var CRC32Class = Java.use('java.util.zip.CRC32');

                CRC32Class.$init.implementation = function () {
                    console.log("CRC32 constructor function is called");
                    return this.$init();
                };

                CRC32Class.update.overload('[B').implementation = function (arg0) {
                    console.log("CRC32->update:", JSON.stringify(arg0));
                    var result = this.update(arg0);
                    return result;
                };
                CRC32Class.update.overload('java.nio.ByteBuffer').implementation = function (arg0) {
                    console.log("CRC32->update.overload('java.nio.ByteBuffer'):", JSON.stringify(arg0));
                    var result = this.update(arg0);
                    return result;
                };
                CRC32Class.update.overload('int').implementation = function (arg0) {
                    console.log("CRC32->update.overload('int'):", JSON.stringify(arg0));
                    var result = this.update(arg0);
                    return result;
                };
                CRC32Class.update.overload('int', 'int').implementation = function (arg0, arg1) {
                    console.log("CRC32->update.overload('int', 'int'):", arg0, '---', arg1);
                    var result = this.update(arg0, arg1);
                    return result;
                };
                CRC32Class.update.overload('[B', 'int', 'int').implementation = function (arg0, arg1, arg2) {
                    console.log("CRC32->update:", JSON.stringify(arg0), "---:", "---", arg1, "---", arg2);
                    var result = this.update(arg0, arg1, arg2);
                    return result;
                };
                CRC32Class.getValue.implementation = function () {
                    var result = this.getValue();
                    console.log("CRC32->getValue:", result);
                    return result;
                };
            
        })
    }
}

function hook_pthread(){
    var pthread_create_addr = Module.findExportByName("libc.so","pthread_create")
    console.log("pthread_create_addr:",pthread_create_addr)
    var time_addr = Module.findExportByName("libc.so","time")
    Interceptor.attach(pthread_create_addr,{
        onEnter:function(args){
            console.log("pthread_create on enter,args:",args[0],args[1],args[2],args[3])
            var libnative_addr = Module.findBaseAddress('libnative-lib.so')
            if(libnative_addr!=null){
                console.log("libnative addr:",libnative_addr)
                var detect_frida_loop_offset = args[2]-libnative_addr
                console.log('pthread function detect_frida_loop offset:',detect_frida_loop_offset)
                if(detect_frida_loop_offset==64944){
                    console.log('find anti  frida! function was replaced by:',time_addr)
                    args[2] = time_addr

                }
            }
        },onLeave:function(retval){
            console.log('retval:',retval)
        }
    })
}
function replace_pthread(){
    var pthread_create_addr = Module.findExportByName("libc.so","pthread_create")
    console.log("pthread_create_addr:",pthread_create_addr)
    var pthread_create = new NativeFunction(pthread_create_addr,'int',['pointer','pointer','pointer','pointer'])

    Interceptor.replace(pthread_create_addr,
        new NativeCallback(function(arg1,arg2,arg3,arg4){
            console.log("native callback args:",arg1,arg2,arg3,arg4)
            var libnative_addr = Module.findBaseAddress('libnative-lib.so')
            if(libnative_addr!=null){
                console.log("libnative addr:",libnative_addr)
                var detect_frida_loop_offset = arg3-libnative_addr
                console.log('pthread function detect_frida_loop offset:',detect_frida_loop_offset)
                if(detect_frida_loop_offset==64944){
                    return null;

                }
            }
            return pthread_create(arg1,arg2,arg3,arg4)
        },'int',['pointer','pointer','pointer','pointer'] ))
}

function writeSomething(path,contents){
    var fopen_addr = Module.findExportByName("libc.so","fopen")
    var fputs_addr = Module.findExportByName("libc.so","fputs")
    var fclose_addr = Module.findExportByName("libc.so","fclose")
    // console.log("fopen addr:",fopen_addr,",fputs addr:",fputs_addr,",fclose addr:",fclose_addr)

    var fopen = new NativeFunction(fopen_addr,'pointer',['pointer','pointer'])
    var fputs = new NativeFunction(fputs_addr,'int',['pointer','pointer'])
    var fclose = new NativeFunction(fclose_addr,'int',['pointer'])

    var fileName = Memory.allocUtf8String(path)
    var mod = Memory.allocUtf8String("a+")
    var fp = fopen(fileName,mod)
    var content = Memory.allocUtf8String(contents)
    //somethime we will get a error for the permission,
    fputs(content,fp)
    fclose(fp)
}


function enmurateAllExports(){
    var modules = Process.enumerateModules();
    // console.log("Process.enumerateModules():",JSON.stringify(modules))
    for(var i = 0;i<modules.length;i++){
        var module = modules[i];
        var module_name = module.name
        var exports = module.enumerateExports()
        console.log("module name:",module_name)

        for(var i=0;i<exports.length;i++){
            writeSomething("/sdcard/settings/"+module_name+'.txt',
            "type:"+exports[i].type+" name:"+exports[i].name+" address:"+exports[i].address+"\n")
        }  
    }
}
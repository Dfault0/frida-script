function hook_java(){
    Java.perform(function(){
         //有重载需要指定函数的参数
         Java.use("com.example.MainActivity").fun.overload('int', 'int').implementation = function(arg1,arg2){
            var result = this.fun(arg1,arg2);
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log("arg1,arg2,result",arg1,arg2,result)
            return result;
        }
    })
}
/**
 * 主动调用
 */
function call_java(){
    Java.perform(function(){
         //因为是动态的方法，所以需要获取到instance之后再进行调用
         Java.choose("com.example.MainActivity",{
            onMatch:function(instance){
                console.log("found instance:",instance)
                instance.secret();
                console.log("instance secret:",instance.secret())
            },onComplete:function(){}
        })
        //如果某个函数是静态的方法的话，就可以直接嗲用该函数即可，
        var result = Java.use("com.example.MainActivity").secret2()
        console.log("secret2:",result);
    
    })
}
function set_java_member_vaule(){
    Java.perform(function (){
        Java.use("com.example.androiddemo.Activity.FridaActivity2").setStatic_bool_var();
        //如果是静态变量和静态方法，可以直接利用类名就可以修改
        Java.use("com.example.androiddemo.Activity.FridaActivity3").static_bool_var.value=true;
        var fridaActivity3Handle = null
        Java.choose("com.example.androiddemo.Activity.FridaActivity3",{
            onMatch:function(instance){
                console.log("found instance:",instance)
                fridaActivity3Handle = instance
                //如果是非静态的，则需要获取他的类的handle才可以修改
                fridaActivity3Handle.bool_var.value = true
                //同名变量需要加一个下划线（成员变量名和函数名子一样）
                fridaActivity3Handle._same_name_bool_var.value = true
            },onComplete:function(){console.log("search completed!")}
        })
    })
}
function get_inner_class_method(){
    Java.perform(function(){
        var class_name = "com.example.androiddemo.Activity.FridaActivity4$InnerClasses"
        var clazz = Java.use(class_name)
        var methods = clazz.class.getDeclaredMethods()
        for(var i=0;i<methods.length;i++){
             var method = methods[i]
             // console.log(method)
             //得到去除类名的函数的签名
            var subString = method.toString().substr(method.toString().indexOf(class_name)+class_name.length+1)
            //得到类的方法名
            var finalMethodString = subString.substr(0,subString.indexOf('('))
            console.log(finalMethodString)
            clazz[finalMethodString].implementation = function(){return true}
         } 
   })
}
function hook_java_dynamic_load(){
    Java.perform(function(){
        //方法1：
        Java.enumerateClassLoaders({
            onMatch:function(loader){
                try {
                    //找到类名
                    if(loader.findClass("com.example.androiddemo.Dynamic.DynamicCheck")){
                        console.log("Succefully found loader!",loader);
                        Java.classFactory.loader = loader;
                    }
                } catch (error) {
                    console.log("found error "+error)
                }
            },onComplete:function(){"enum completed!"}
        })     
        Java.use("com.example.androiddemo.Dynamic.DynamicCheck").check.implementation = function(){
            return true
        }   
        //方法2：
        Java.enumerateLoadedClasses({
            onMatch:function(name,handle){
                if(name.toString().indexOf("com.example.androiddemo.Activity.Frida6.Frida6")>=0){
                    console.log("name",name)
                    //hook
                    Java.use(name).check.implementation = function(){
                        return true
                    }
                }
            },onComplete(){}
        })     
    })
}
function main(){
    hook_java()
    call_java()
}
setImmediate(main)
//延时
// setImmediate(main,100)
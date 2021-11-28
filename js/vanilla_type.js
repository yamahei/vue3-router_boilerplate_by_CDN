/**
 * VanillaType.js: Install simple type system into vanilla JS
 * https://gist.github.com/yamahei/ec0aa4b796710756f4627dcc9f35def9
 *
 * Usage:
 * 1. create my type definition:
 *     VanillaTypeDefine = {
 *       type: Number | String | Boolean | Array | Object | VanillaType,
 *       nullable: Boolean,
 *       self: Function, // to check my self variable, only not Array | Object, argument is Value, and return truely | falsy.
 *       children: Function, // to check, only Array | Object, argument is [element, suffix], and return truely | falsy.
 *     };
 *
 * 2. create type checker instance
 *     const HogeType = VanillaType(VanillaTypeDefine);
 *
 * 3. check variable type in your code
 *     function(_arg1){
 *         //as guard clause
 *         const arg1 = HogeType(_arg1);//=> return _arg1 or raise exception
 *         // do something...
 *     }
 *
 * TODO:
 *     * test is not enough..
 *     * be more useful!
 */
(function(g){

    const typeOf = function(obj) {//=> string
        return toString.call(obj).slice(8, -1).toLowerCase();
    }
    const isEmpty = function(type, obj){
        if(obj===undefined || obj===null){ return true; }
        if(isString(obj) && type === String){ return obj===""; }
        if(isNumber(obj) && type === Number){ return isNaN(obj); }
        return false;
    };
    const isBoolean = function(obj){ return typeOf(obj) === 'boolean'; };
    const isNumber = function(obj){ return typeOf(obj) === 'number'; };
    const isString = function(obj){ return typeOf(obj) === 'string'; };
    const isDate = function(obj){ return typeOf(obj) === 'date'; };
    const isArray = function(obj){ return typeOf(obj) === 'array'; };
    const isObject = function(obj){ return typeOf(obj) === 'object'; };
    const isFunction = function(obj){ return typeOf(obj) === 'function'; };
    const instanceIsAClass = function(klass, instance){
        // {} instance of Object, [] instance of Object and Array, new Date() of Object and Date ...
        const checklist = [
            {klass: Boolean,  func: isBoolean},
            {klass: Number,   func: isNumber},
            {klass: String,   func: isString},
            {klass: Date,     func: isDate},
            {klass: Array,    func: isArray},
            {klass: Function, func: isFunction},
            {klass: Object,   func: isObject},
        ];
        const checkitem = checklist.find(function(e){ return e.klass==klass; });
        const directchecker = function(e){ return e instanceof klass; };
        const checker = checkitem ? checkitem.func : directchecker;
        return checker(instance);
    };

    const VanillaTypeDefinitionCheckerArgument = {//toooo looong name...
        type: Object,
        nullable: false,
        self: function(value){ return true; },
        children: function(element, suffix){
            switch(suffix){
                case "type": return (
                    false
                    || element === Boolean
                    || element === Number
                    || element === String
                    || element === Date
                    || element === Array
                    || element === Object
                    || element.prototype === VanillaTypeInstance
                );
                case "nullable": return isBoolean(element);
                case "self": return isFunction(element);
                case "children": return isFunction(element);
                default: return false;
            }
        },
    };
    const VanillaTypeInstance = function(define){//=> function
        return function(value){//=> value or die
            if(isEmpty(define.type, value)){
                if(define.nullable){ return value; }//=> null
                else{
                    console.log({define: define, value: value});
                    throw new Error("empty value was given to non nullable type.");
                }
            }
            const type_is_valid = instanceIsAClass(define.type, value);
            if(!type_is_valid){
                console.log({define: define, value: value});
                throw new Error("invalid type of value was given.");
            }
            const value_is_array = isArray(value);
            const value_is_object = isObject(value);
            const has_self_checker = !!define.self && (!value_is_array && !value_is_object);
            const has_child_checker = !!define.children && (value_is_array || value_is_object);
            if(has_self_checker){
                if(!define.self(value)){
                    console.log({define: define, value: value});
                    throw new Error(`invalid value.`);
                }
            }
            if(has_child_checker){//check children
                if(value_is_array){
                    for(let index=0; index<value.length; index++){
                        const child_is_valid = define.children(value[index], index);//TODO: handle exception and return message.
                        if(!child_is_valid){//TODO: pass falsy value
                            console.log({define: define, index: index, value: value[index]});
                            throw new Error(`children of array(index: ${index}) was invalid.`);
                        }
                    }
                }
                if(value_is_object){
                    Object.keys(value).forEach(function(key){
                        const child_is_valid = define.children(value[key], key);//TODO: handle exception and return message.
                        if(!child_is_valid){//TODO: pass falsy value
                            console.log({define: define, key: key, value: value[key]});
                            throw new Error(`children of object(key: ${key}) was invalid.`);
                        }
                    });
                }
            }
            return value;
        };
    };
    const VanillaTypeChecker = new VanillaTypeInstance(VanillaTypeDefinitionCheckerArgument);
    const VanillaType = g.VanillaType = g.VanillaType || function(_define){//=> VanillaTypeInstance for _define
        const define = VanillaTypeChecker(_define);
        const typechecker = new VanillaTypeInstance(define);
        return function(value){
            try{ return typechecker(value); }
            catch(e){ throw e; }
        };
    };
    /**
     * Define typical types.
     */
    // Boolean
    VanillaType.Boolean = VanillaType({ type: Boolean, nullable: false });
    VanillaType.NullableBoolean = VanillaType({ type: Boolean, nullable: true });
    // Number
    VanillaType.Number = VanillaType({ type: Number, nullable: false });
    VanillaType.NullableNumber = VanillaType({ type: Number, nullable: true });
    VanillaType.NumberInRange = function(min, max){
        const min_is = (min || min === 0);
        const max_is = (max || max === 0);
        if(min_is && max_is && (min >= max)){
            throw new Error(`Invalid Range: min=${min}, max=${max}`);
        }
        if((min_is && !isNumber(min)) || (max_is && !isNumber(max))){
            throw new Error(`Invalid argument type: min=${min}, max=${max}`);
        }
        const self = function(value){
            if(min_is && value < min){ throw new Error(`Range error: ${value} < ${min}`); }
            if(max_is && max < value){ throw new Error(`Range error: ${max} < ${value}`); }
            return true;
        };
        return VanillaType({ type: Number, nullable: false, self: self });
    };
    // String
    VanillaType.String = VanillaType({ type: String, nullable: false });
    VanillaType.NullableString = VanillaType({ type: String, nullable: true });
    const reg_mail = function(v){ return v.match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/); };
    VanillaType.StrMail = VanillaType({ type: String, nullable: false, self: reg_mail });
    VanillaType.NullableStrMail = VanillaType({ type: String, nullable: true, self: reg_mail });
    const reg_url = function(v){ return v.match(/^https?:\/\/[\w!\?/\+\-\.\$\(\)\[\]_~=;,&@#%\*']+$/); };
    VanillaType.StrURL = VanillaType({ type: String, nullable: false, self: reg_url });
    VanillaType.NullableStrURL = VanillaType({ type: String, nullable: true, self: reg_url });
    const reg_tel = function(v){ return v.match(/^\d+(-\d+){1,2}$/); };
    VanillaType.StrTel = VanillaType({ type: String, nullable: false, self: reg_tel });
    VanillaType.NullableStrTel = VanillaType({ type: String, nullable: true, self: reg_tel });
    // Date
    VanillaType.Date = VanillaType({ type: Date, nullable: false });
    VanillaType.NullableDate = VanillaType({ type: Date, nullable: true });
    VanillaType.DateInRange = function(min, max){
        const min_is = (min || min === 0);
        const max_is = (max || max === 0);
        if(min_is && max_is && (min >= max)){
            throw new Error(`Invalid Range: min=${min}, max=${max}`);
        }
        if((min_is && !isDate(min)) || (max_is && !isDate(max))){
            throw new Error(`Invalid argument type: min=${min}, max=${max}`);
        }
        const self = function(value){
            if(min_is && value < min){ throw new Error(`Range error: ${value} < ${min}`); }
            if(max_is && max < value){ throw new Error(`Range error: ${max} < ${value}`); }
            return true;
        };
        return VanillaType({ type: Date, nullable: false, self: self });
    };

    // Array
    VanillaType.Array = VanillaType({ type: Array, nullable: false });
    // VanillaType.NullableArray = VanillaType({ type: Array, nullable: true });//unnecessary
    VanillaType.ArrayOf = function(vtInstance){
        const children = function(element, suffix){
            try{ return vtInstance(element); }catch(e){ throw e; }
        }
        return VanillaType({ type: Array, nullable: false, children: children });
    }
    // Object
    VanillaType.Object = VanillaType({ type: Object, nullable: false });
    //VanillaType.NullableObject = VanillaType({ type: Object, nullable: true });//unnecessary
    VanillaType.ObjectOf = function(vtInstanceSet){
        const children = function(element, suffix){
            const invalid_key = (x)=>{ return false; };
            const validator = vtInstanceSet[suffix] || invalid_key;
            return validator(element);
        };
        return VanillaType({ type: Object, nullable: false, children: children });
    };

})(this);

/* Test
const assert_true = function(func){
    func();
}
const assert_exception = function(func){
    try{ func();} catch(e){ return; }//do nothing.
    throw new Error("exception was expected.");
}

//
// Test for typical validator
//
const BooleanType = VanillaType.Boolean;
assert_true(()=> BooleanType(true) )
assert_true(()=> BooleanType(false) )
assert_exception(()=> BooleanType(null) )
assert_exception(()=> BooleanType(0) )
assert_exception(()=> BooleanType(1) )
assert_exception(()=> BooleanType("") )
assert_exception(()=> BooleanType("a") )
assert_exception(()=> BooleanType(NaN) )

const NullableBooleanType = VanillaType.NullableBoolean;
assert_true(()=> NullableBooleanType(true) )
assert_true(()=> NullableBooleanType(false) )
assert_true(()=> NullableBooleanType(null) )
assert_exception(()=> NullableBooleanType(0) )
assert_exception(()=> NullableBooleanType(1) )
assert_exception(()=> NullableBooleanType("a") )
assert_exception(()=> NullableBooleanType("") )
assert_exception(()=> NullableBooleanType(NaN) )

const NumberType = VanillaType.Number;
assert_true(()=> NumberType(0) )
assert_true(()=> NumberType(1) )
assert_true(()=> NumberType(-1) )
assert_true(()=> NumberType(1.25) )
assert_true(()=> NumberType(-1.25) )
assert_exception(()=> NumberType(null) )
assert_exception(()=> NumberType(NaN) )
assert_exception(()=> NumberType(true) )
assert_exception(()=> NumberType("") )
assert_exception(()=> NumberType(new Date()) )

const NumberInRangeType_both = VanillaType.NumberInRange(0, 100);
assert_true(()=> NumberInRangeType_both(0) )
assert_true(()=> NumberInRangeType_both(1) )
assert_true(()=> NumberInRangeType_both(50) )
assert_true(()=> NumberInRangeType_both(99) )
assert_true(()=> NumberInRangeType_both(100) )
assert_exception(()=> NumberInRangeType_both(-1) )
assert_exception(()=> NumberInRangeType_both(-1000) )
assert_exception(()=> NumberInRangeType_both(101) )
assert_exception(()=> NumberInRangeType_both(1000) )

const NumberInRangeType_minonly = VanillaType.NumberInRange(0, null);
assert_true(()=> NumberInRangeType_minonly(0) )
assert_true(()=> NumberInRangeType_minonly(1) )
assert_true(()=> NumberInRangeType_minonly(50) )
assert_true(()=> NumberInRangeType_minonly(99) )
assert_true(()=> NumberInRangeType_minonly(100) )
assert_exception(()=> NumberInRangeType_minonly(-1) )
assert_exception(()=> NumberInRangeType_minonly(-1000) )
assert_true(()=> NumberInRangeType_minonly(101) )
assert_true(()=> NumberInRangeType_minonly(1000) )

const NumberInRangeType_maxonly = VanillaType.NumberInRange(null, 100);
assert_true(()=> NumberInRangeType_maxonly(0) )
assert_true(()=> NumberInRangeType_maxonly(1) )
assert_true(()=> NumberInRangeType_maxonly(50) )
assert_true(()=> NumberInRangeType_maxonly(99) )
assert_true(()=> NumberInRangeType_maxonly(100) )
assert_true(()=> NumberInRangeType_maxonly(-1) )
assert_true(()=> NumberInRangeType_maxonly(-1000) )
assert_exception(()=> NumberInRangeType_maxonly(101) )
assert_exception(()=> NumberInRangeType_maxonly(1000) )

const NullableNumberType = VanillaType.NullableNumber;
assert_true(()=> NullableNumberType(0) )
assert_true(()=> NullableNumberType(1) )
assert_true(()=> NullableNumberType(-1) )
assert_true(()=> NullableNumberType(1.25) )
assert_true(()=> NullableNumberType(-1.25) )
assert_true(()=> NullableNumberType(null) )
assert_true(()=> NullableNumberType(NaN) )
assert_exception(()=> NullableNumberType(true) )
assert_exception(()=> NullableNumberType("") )
assert_exception(()=> NullableNumberType(new Date()) )

const StringType = VanillaType.String;
assert_true(()=> StringType("a") )
assert_true(()=> StringType("abcdefg") )
assert_exception(()=> StringType("") )
assert_exception(()=> StringType(null) )
assert_exception(()=> StringType(1) )
assert_exception(()=> StringType(new Date) )
assert_exception(()=> StringType([]) )
assert_exception(()=> StringType({}) )

const NullableStringType = VanillaType.NullableString;
assert_true(()=> NullableStringType("a") )
assert_true(()=> NullableStringType("abcdefg") )
assert_true(()=> NullableStringType("") )
assert_true(()=> NullableStringType(null) )
assert_exception(()=> NullableStringType(1) )
assert_exception(()=> NullableStringType(new Date) )
assert_exception(()=> NullableStringType([]) )
assert_exception(()=> NullableStringType({}) )

const StrMailType = VanillaType.StrMail;
assert_true(()=> StrMailType("abc.def@ghi.com") )
assert_exception(()=> StrMailType("") )
assert_exception(()=> StrMailType(null) )

const NullableStrMailType = VanillaType.NullableStrMail;
assert_true(()=> NullableStrMailType("abc.def@ghi.com") )
assert_true(()=> NullableStrMailType("") )
assert_true(()=> NullableStrMailType(null) )
assert_exception(()=> NullableStrMailType(1) )

const StrURLType = VanillaType.StrURL;
assert_true(()=> StrURLType("http://its.some/url?with=param#arent.you") )
assert_true(()=> StrURLType("https://its.some.url/") )
assert_exception(()=> StrURLType("") )
assert_exception(()=> StrURLType(null) )

const NullableStrURLType = VanillaType.NullableStrURL;
assert_true(()=> NullableStrURLType("http://its.some/url?with=param#arent.you") )
assert_true(()=> NullableStrURLType("https://its.some.url/") )
assert_true(()=> NullableStrURLType("") )
assert_true(()=> NullableStrURLType(null) )
assert_exception(()=> NullableStrURLType(1) )

const StrTelType = VanillaType.StrTel;
assert_true(()=> StrTelType("01-234") )
assert_true(()=> StrTelType("01-234-567") )
assert_exception(()=> StrTelType("") )
assert_exception(()=> StrTelType(null) )
assert_exception(()=> StrTelType("01-234-567-890") )
assert_exception(()=> StrTelType(1) )
assert_exception(()=> StrTelType(false) )

const NullableStrTelType = VanillaType.NullableStrTel;
assert_true(()=> NullableStrTelType("01-234") )
assert_true(()=> NullableStrTelType("01-234-567") )
assert_true(()=> NullableStrTelType("") )
assert_true(()=> NullableStrTelType(null) )
assert_exception(()=> NullableStrTelType("01-234-567-890") )
assert_exception(()=> NullableStrTelType(false) )

const DateType = VanillaType.Date;
assert_true(()=> DateType(new Date()) )
assert_true(()=> DateType(new Date("1999-12-31")) )
assert_true(()=> DateType(new Date("2121-1-1")) )
assert_exception(()=> DateType(null) )
assert_exception(()=> DateType(1) )
assert_exception(()=> DateType(true) )
assert_exception(()=> DateType("date!") )

const NullableDateType = VanillaType.NullableDate;
assert_true(()=> NullableDateType(new Date()) )
assert_true(()=> NullableDateType(new Date("1999-12-31")) )
assert_true(()=> NullableDateType(new Date("2121-1-1")) )
assert_true(()=> NullableDateType(null) )
assert_exception(()=> NullableDateType(0) )
assert_exception(()=> NullableDateType(false) )
assert_exception(()=> NullableDateType("") )

const DateInRangeType_both = VanillaType.DateInRange(new Date("2020-1-1"), new Date("2022-12-31"))
assert_true(()=> DateInRangeType_both(new Date("2020-1-1")) )
assert_true(()=> DateInRangeType_both(new Date("2020-1-2")) )
assert_true(()=> DateInRangeType_both(new Date("2021-6-6")) )
assert_true(()=> DateInRangeType_both(new Date("2022-12-30")) )
assert_true(()=> DateInRangeType_both(new Date("2022-12-31")) )
assert_exception(()=> DateInRangeType_both(new Date("2019-12-31")) )
assert_exception(()=> DateInRangeType_both(new Date("2009-12-31")) )
assert_exception(()=> DateInRangeType_both(new Date("2023-1-1")) )
assert_exception(()=> DateInRangeType_both(new Date("2122-12-31")) )

const DateInRangeType_minonly = VanillaType.DateInRange(new Date("2020-1-1"), null)
assert_true(()=> DateInRangeType_minonly(new Date("2020-1-1")) )
assert_true(()=> DateInRangeType_minonly(new Date("2020-1-2")) )
assert_true(()=> DateInRangeType_minonly(new Date("2021-6-6")) )
assert_true(()=> DateInRangeType_minonly(new Date("2022-12-30")) )
assert_true(()=> DateInRangeType_minonly(new Date("2022-12-31")) )
assert_exception(()=> DateInRangeType_minonly(new Date("2019-12-31")) )
assert_exception(()=> DateInRangeType_minonly(new Date("2009-12-31")) )
assert_true(()=> DateInRangeType_minonly(new Date("2023-1-1")) )
assert_true(()=> DateInRangeType_minonly(new Date("2122-12-31")) )

const DateInRangeType_maxonly = VanillaType.DateInRange(null, new Date("2022-12-31"))
assert_true(()=> DateInRangeType_maxonly(new Date("2020-1-1")) )
assert_true(()=> DateInRangeType_maxonly(new Date("2020-1-2")) )
assert_true(()=> DateInRangeType_maxonly(new Date("2021-6-6")) )
assert_true(()=> DateInRangeType_maxonly(new Date("2022-12-30")) )
assert_true(()=> DateInRangeType_maxonly(new Date("2022-12-31")) )
assert_true(()=> DateInRangeType_maxonly(new Date("2019-12-31")) )
assert_true(()=> DateInRangeType_maxonly(new Date("2009-12-31")) )
assert_exception(()=> DateInRangeType_maxonly(new Date("2023-1-1")) )
assert_exception(()=> DateInRangeType_maxonly(new Date("2122-12-31")) )

const ArrayType = VanillaType.Array;
assert_true(()=> ArrayType([]) )
assert_true(()=> ArrayType([1,2]) )
assert_true(()=> ArrayType(["a", "b"]) )
assert_true(()=> ArrayType([null]) )//ATTENTION:  allow empty element
assert_true(()=> ArrayType(new Array(2)) )//ATTENTION:  allow empty element
assert_exception(()=> ArrayType(null) )
assert_exception(()=> ArrayType(0) )

const ArrayOfMailType = VanillaType.ArrayOf(StrMailType);
assert_true(()=> ArrayOfMailType([]) )
assert_true(()=> ArrayOfMailType(["abc.def@ghi.jk"]) )
assert_exception(()=> ArrayOfMailType([""]) )// StrMailType is not nullable 
assert_exception(()=> ArrayOfMailType([null]) )// StrMailType is not nullable 

const ArrayOfNullableStringType = VanillaType.ArrayOf(NullableStringType);
assert_true(()=> ArrayOfNullableStringType([]) )
assert_true(()=> ArrayOfNullableStringType(["abc.def@ghi.jk"]) )
//assert_true(()=> ArrayOfNullableStringType([""]) )//FIXME: NullableStringType is nullable 
//assert_true(()=> ArrayOfNullableStringType([null]) )//FIXME: NullableStringType is nullable 
assert_exception(()=> ArrayOfNullableStringType(null) )// ArrayOf is not nullable 

const ObjectType = VanillaType.Object;
assert_true(()=> ObjectType({}) )
assert_true(()=> ObjectType({a:1}) )
assert_true(()=> ObjectType({a:new Date()}) )
assert_true(()=> ObjectType({a:null}) )//ATTENTION:  allow empty element
assert_exception(()=> ObjectType(null) )

const ObjectOfComplexType = VanillaType.ObjectOf({ id: NumberType, mail: StrMailType });
assert_true(()=> ObjectOfComplexType({}) )
assert_true(()=> ObjectOfComplexType({id: 1}) )//allow
assert_true(()=> ObjectOfComplexType({mail: "abc.def@ghi.jk"}) )//allow
assert_true(()=> ObjectOfComplexType({id: 1, mail: "abc.def@ghi.jk"}) )
assert_exception(()=> ObjectOfComplexType({id: "1"}) )
assert_exception(()=> ObjectOfComplexType({mail: "http://some.url/"}) )
assert_exception(()=> ObjectOfComplexType({invalid: "key"}) )


//
// Test for hand-made validator
//
const test1_nullable_object = VanillaType({
    type: Object, nullable: true,
});
assert_true(()=> test1_nullable_object({}) )
assert_true(()=> test1_nullable_object(null) )
assert_true(()=> test1_nullable_object(undefined) )
assert_exception(()=> test1_nullable_object("") )
assert_exception(()=> test1_nullable_object([]) )
assert_exception(()=> test1_nullable_object(1) )

const test2_complex_array = VanillaType({
    type: Array, nullable: false,
    children: function(element, suffix){
        if(element instanceof String || typeof element== 'string'){ return true; }
        if(element instanceof Number || typeof element== 'number'){ return true; }
        return false;
    }
});
assert_true(()=> test2_complex_array([]) )
assert_true(()=> test2_complex_array([1, 2]) )
assert_true(()=> test2_complex_array(["a", "b"]) )
assert_true(()=> test2_complex_array([1, "a"]) )
assert_exception(()=> test2_complex_array(null) )
assert_exception(()=> test2_complex_array(1) )
assert_exception(()=> test2_complex_array("a") )
assert_exception(()=> test2_complex_array({}) )

const _test3_element_type = VanillaType({
    type: Object, nullable: true,
    children: function(element, suffix){
        const invalid_key = (x)=>{ return false; }
        const validator = {
            id: (e)=>(e instanceof Number || typeof e == 'number'),
            title: (e)=>(e instanceof String || typeof e == 'string'),
            content: (e)=>(e instanceof String || typeof e == 'string'),
            created: (e)=>(e instanceof Date || typeof e == 'date'),
        }[suffix] || invalid_key;
        return validator(element);
    }
});
const test3_object_array = VanillaType({
    type: Array, nullable: true,
    children: function(element, suffix){
        return _test3_element_type(element);
    },
});
assert_true(()=> test3_object_array(null) )
assert_true(()=> test3_object_array([]) )
assert_true(()=> 
    test3_object_array([
        {id: 1, title: "a", content: "b", created: new Date()},
    ])
);
assert_exception(()=> 
    test3_object_array([
        {id: 1, title: "a", content: "b", created: new Date()},
        null,
    ])
);
assert_exception(()=> test3_object_array([null]) ); 
assert_exception(()=> test3_object_array([{hoge: 1, fuga: new Date()}]) );

const test4_string_telno = VanillaType({
    type: String,
    nullable: true,
    self: function(value){
        //type is string and not null value are ensured here.
        return value.match(/^\d+(-\d+){1,2}$/)
    },
});
assert_true(()=> test4_string_telno(null) )
assert_true(()=> test4_string_telno(undefined) )
assert_true(()=> test4_string_telno("") )
assert_true(()=> test4_string_telno("01-234-5678") )
assert_true(()=> test4_string_telno("01-234") )
assert_exception(()=> test4_string_telno("01") )
assert_exception(()=> test4_string_telno("01-") )
assert_exception(()=> test4_string_telno("01-234-5678-910") )
*/

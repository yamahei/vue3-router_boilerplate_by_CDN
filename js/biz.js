(function(g){

    const Biz = g.Biz = g.Biz || function(){};

    const _childrencheck_with_object = function(
        object_key_check_func,// { key: check_func }
        allow_unknown_key,// Boolean
    ){
        const unknown_key_checker = allow_unknown_key ?
            function(element, suffix){ return true; } :
            function(element, suffix){
                throw new Error(`unknown key: ${suffix}.`);
            }
        const _childrencheck = function(element, suffix){
            const check_func = object_key_check_func[suffix] || unknown_key_checker;
            return check_func(element, suffix);
        }
    };
    const col_typedef = {
        type: Object,
        nullable: false,
        children: _childrencheck_with_object({
            name: 1
        }, false),
    }

})(this);

/**
 * Test
 */
import {ElementType, Key, Props, ReactElementType, Ref, Type} from '../../shared/ReactTypes'
import {REACT_ELEMENT_TYPE} from "../../shared/ReactSymbols";

const ReactElement = function (type: Type,
                               key: Key,
                               ref: Ref,
                               props: Props): ReactElementType {
    const element = {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref,
        props,
        __mark: 'zll'
    }
    return element;

}


export const jsx = (type: ElementType, config: any, ...children: any) => {
    let key: Key = null
    let ref: Ref = null
    const props: Props = {}
    for (const prop in config) {
        const val = config[prop]
        if (prop === 'key') {
            if (val !== undefined)
                key = '' + val
            continue;
        }
        if (prop === 'ref') {
            if (val !== undefined) {
                ref = val
            }
            continue;
        }
        if (Object.hasOwn(config, prop)) {//等价于Object.hasOwnProperty.call(config,prop)
            props[prop] = val
        }
    }
    const childrenLength = children.length
    if (childrenLength) {
        if (childrenLength === 1) {
            props.children = children[0]
        } else {
            props.children = children
        }
    }
    return ReactElement(type, key, ref, props)
}
/**
 * 注释: 开发环境专用
 * 时间: 2025/12/24 9:43
 * @author 钟林林
 */
export const jsxDEV = (type: ElementType, config: any) => {
    let key: Key = null
    let ref: Ref = null
    const props: Props = {}
    for (const prop in config) {
        const val = config[prop]
        if (prop === 'key') {
            if (val !== undefined)
                key = '' + val
            continue;
        }
        if (prop === 'ref') {
            if (val !== undefined) {
                ref = val
            }
            continue;
        }
        if (Object.hasOwn(config, prop)) {//等价于Object.hasOwnProperty.call(config,prop)
            props[prop] = val
        }
    }

    return ReactElement(type, key, ref, props)
}


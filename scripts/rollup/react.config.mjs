import {getBaseRollupPlugins, getPackageJSON, resolvePkgPath} from "./utils.mjs";
import path from "path";
import generatePackageJson from "rollup-plugin-generate-package-json";

const {name, module} = getPackageJSON('react')
const pkgPath = resolvePkgPath(name)
const pkgDistPath = resolvePkgPath(name, true)

export default [{
    input: path.join(pkgPath, module),
    output: {
        file: path.join(pkgDistPath, 'index.js'),
        name: 'React',
        format: 'umd'
    },
    plugins: [
        ...getBaseRollupPlugins(),
        generatePackageJson({
            inputFolder: pkgPath,
            outputFolder: pkgDistPath,
            baseContents: ({name, description, version}) => ({
                name,
                description,
                version,
                main: 'index.js',
            })
        })
    ]
}, {
    input: path.join(pkgPath, 'src', 'jsx.ts'),
    output: [{
        file: path.join(pkgDistPath, 'jsx-runtime.js'),
        name: 'jsx-runtime',
        format: 'umd'
    }, {
        file: path.join(pkgDistPath, 'jsx-dev-runtime.js'),
        name: 'jsx-dev-runtime',
        format: 'umd'
    }],
    plugins: getBaseRollupPlugins()
}
]

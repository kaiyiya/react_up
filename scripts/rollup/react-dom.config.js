import {getPackageJSON, resolvePkgPath, getBaseRollupPlugins} from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
import path from "path";

const {name, module, peerDependencies} = getPackageJSON('react-dom');
// react-dom 包的路径
const pkgPath = resolvePkgPath(name);
// react-dom 包的产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
    // react-dom
    {
        input: path.join(pkgDistPath, 'module'),
        output: [
            {
                file: path.join(pkgDistPath, 'index.js'),
                name: 'ReactDOM',
                format: 'umd'
            },
            {
                file: path.join(pkgDistPath, 'client.js'),
                name: 'client',
                format: 'umd'
            }
        ],
        external: [...Object.keys(peerDependencies)],
        plugins: [
            ...getBaseRollupPlugins(),
            // webpack resolve alias
            alias({
                entries: {
                    hostConfig: path.join(pkgPath, 'src', 'hostConfig.ts')
                }
            }),
            generatePackageJson({
                inputFolder: pkgPath,
                outputFolder: pkgDistPath,
                baseContents: ({name, description, version}) => ({
                    name,
                    description,
                    version,
                    peerDependencies: {
                        react: version
                    },
                    main: 'index.js'
                })
            })
        ]
    },
];

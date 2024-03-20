module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: "coverage",
    collectCoverageFrom: [
        "package/**/*.{ts,js,jsx}"
    ],
    coveragePathIgnorePatterns: [
        "jest.config.js",
        "/node_modules/",
        "/dist/",
    ],
    moduleNameMapper: {
        '^@corset/(.*)$': '<rootDir>/package/$1/'
    }
};
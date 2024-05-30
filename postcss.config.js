module.exports = {
    plugins: [
        require("postcss-cssnext"),
        require("postcss-import"),
        ...(process.env.NODE_ENV === "production" ? [require("cssnano")] : []),
    ],
};
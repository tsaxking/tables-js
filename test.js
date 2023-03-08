const calculate = (str) => {
    str = str.replace(/\s/g, '');
    const evaluate = (str) => {
        if (str.includes('(')) {
            str = getParentheses(str);
        };
        const operators = ['^', '*', '/', '+', '-'];
        
        return operators.reduce((acc, operator) => {
            const run = (str) => {
                const index = str.lastIndexOf(operator);
                if (index === -1) {
                    return str;
                }

                const replace = (str, index, operator) => {
                    const leftIndex = (() => {
                        let i = index - 1;
                        // get the left full number (including decimals)
                        while (i >= 0 && !isNaN(+str[i]) || str[i] === '.') {
                            i--;
                        }
                        return i + 1;
                    })();

                    const rightIndex = (() => {
                        let i = index + 1;
                        // get the right full number (including decimals)
                        while (i < str.length && !isNaN(+str[i]) || str[i] === '.') {
                            i++;
                        }
                        return i;
                    })();


                    const left = +str.substring(leftIndex, index);
                    const right = +str.substring(index + 1, rightIndex);

                    const test = (input) => {
                        return true;
                    }

                    if (!test(left) || !test(right)) {
                        throw new Error('Invalid input', left, right, str);
                    }

                    console.log(left, operator, right);

                    const result = (() => {
                        switch (operator) {
                            case '^':
                                return Math.pow(left, right);
                            case '*':
                                return left * right;
                            case '/':
                                return left / right;
                            case '+':
                                return +left + +right;
                            case '-':
                                return left - right;
                        }
                    })();

                    return str.substring(0, leftIndex) + result + str.substring(rightIndex);
                }

                str = replace(str, index, operator);
                if (str.includes(operator)) {
                    return run(str);
                }
                return str;
            }
            return run(acc);
        }, str);
    }

    const getParentheses = (str) => {
        // get innermost parentheses
        const start = str.lastIndexOf('(');
        const end = str.indexOf(')', start);
        const inner = str.substring(start + 1, end);

        // evaluate innermost parentheses
        const result = evaluate(inner);

        // replace innermost parentheses with result
        str = str.substring(0, start) + result + str.substring(end + 1);

        // if there are still parentheses, evaluate again
        if (str.includes('(')) {
            return getParentheses(str);
        }

        return str;
    };

    const result = evaluate(str);
    if (isNaN(result)) {
        throw new Error('Invalid input: evaluated to: ' + result );
    }
    return +result;
}

console.log('result',calculate('((((3+2)/(4+5))/7)+3)'));
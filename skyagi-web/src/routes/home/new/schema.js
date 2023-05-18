import * as yup from 'yup'

let errors = {}

const schema = yup.object().shape({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().required('Email is required').email('Email is invalid'),
})

const validateValues = async (values) => {
    try {
        await schema.validate(values, { abortEarly: false })
        errors = {}
    } catch (err) {
        errors = err.inner.reduce((acc, err) => {
            return { ...acc, [err.path]: err.message }
        }, {})
    }
    return errors
}

export { schema, validateValues, errors }

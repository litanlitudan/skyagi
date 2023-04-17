def verify_openai_token(token: str) -> str:
    import openai
    openai.api_key = token
    try:
        openai.Completion.create(
            model="text-ada-001",
            prompt="Hello",
            temperature=0,
            max_tokens=10,
            top_p=1,
            frequency_penalty=0.5,
            presence_penalty=0
        )
        return "OK"
    except Exception as e:
        return str(e)

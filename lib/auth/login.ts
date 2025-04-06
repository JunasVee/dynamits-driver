export async function login(email: string, password: string) {
    const response = await fetch("https://api.dynamits.id/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
  
    if (!response.ok) {
      throw new Error("Login failed")
    }
  
    const result = await response.json()
  
    if (!result.status) {
      throw new Error(result.message || "Authentication failed")
    }
  
    return result.data
  }
  
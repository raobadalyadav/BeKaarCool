import { useState } from "react"
import { toast } from "sonner"

interface PincodeData {
  pincode: string
  district: string
  state: string
  country: string
  area: string
  division: string
  region: string
}

export function usePincode() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PincodeData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPincodeData = async (pincode: string) => {
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pincode?pincode=${pincode}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch pincode details")
      }

      setData(result)
      return result
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch pincode details"
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const validatePincode = (pincode: string): boolean => {
    return /^\d{6}$/.test(pincode)
  }

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return {
    loading,
    data,
    error,
    fetchPincodeData,
    validatePincode,
    reset
  }
}
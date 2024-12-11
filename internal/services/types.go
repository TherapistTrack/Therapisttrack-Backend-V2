package services

type RoleDependentInfo struct {
	Id               string
	CollegiateNumber string
	Specialty        string
	StartDate        string
	EndDate          string
	DPI              string
}

type User struct {
	Id                string
	Names             string
	LastNames         string
	Phones            []string
	Mails             []string
	Role              string
	RoleDependentInfo RoleDependentInfo
}

type RecordFields struct {
	name string
}

type Record struct {
	id        string
	names     string
	lastNames string
	fields    []RecordFields
}

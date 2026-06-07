// a=1, b=2 -> in max heap, 2 should go at the top, so a.first > b.first
// a="apple", b="banana"

struct cmp{
    bool operator()(pair<int,string> &a, pair<int,string> &b){
        if(a.first != b.first){
            // if max heap then 
            return a.first < b.first;
        }
        // for the alphabet comparision, if max heap then:
        return a.second < b.second;
    }
}

now suppose if i want smaller freq as well as lexicographically smaller string to go up, 
So I will do :

struct cmp{
    bool operator()(pair<int,string> &a, pair<int,string> &b){
        if(a.first != b.first) return a.first > b.first
        return a.second > b.second;
    }
}

// a min max heap where the first elements min element, and lexi larger string
struct cmp{
    bool operator()(pair<int,string> &a, pair<int,string> &b){
        if(a.first != b.first) return a.first > b.first;
        return a.second < b.second;
    }
}
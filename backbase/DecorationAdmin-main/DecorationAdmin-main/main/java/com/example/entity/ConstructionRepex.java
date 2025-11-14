package com.example.entity;

import com.baomidou.mybatisplus.extension.activerecord.Model;

import java.util.List;

public class ConstructionRepex extends Model<ConstructionRepex> {
    private List<ConstructionRep> constructionRepList;
    //个凭证总花销
    private List<Integer> certmoney;
    //总花销
    private Integer moneyinall;

    public ConstructionRepex() {
    }

    public ConstructionRepex(List<ConstructionRep> constructionRepList, List<Integer> certmoney, Integer moneyinall) {
        this.constructionRepList = constructionRepList;
        this.certmoney = certmoney;
        this.moneyinall = moneyinall;
    }

    public List<ConstructionRep> getConstructionRepList() {
        return constructionRepList;
    }

    public void setConstructionRepList(List<ConstructionRep> constructionRepList) {
        this.constructionRepList = constructionRepList;
    }

    public List<Integer> getCertmoney() {
        return certmoney;
    }

    public void setCertmoney(List<Integer> certmoney) {
        this.certmoney = certmoney;
    }

    public Integer getMoneyinall() {
        return moneyinall;
    }

    public void setMoneyinall(Integer moneyinall) {
        this.moneyinall = moneyinall;
    }
}
